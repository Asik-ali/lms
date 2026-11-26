package com.lms.app;

import android.content.ContentValues;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.OutputStream;

@CapacitorPlugin(name = "InvoiceDownload")
public class InvoiceDownloadPlugin extends Plugin {
    @PluginMethod
    public void savePdf(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename", "invoice.pdf");
        if (base64 == null || base64.isEmpty()) {
            call.reject("Invoice data is missing.");
            return;
        }
        Uri uri = null;
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length < 5 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F' || bytes[4] != '-') {
                throw new IllegalArgumentException("The generated invoice is not a valid PDF.");
            }
            filename = filename.replaceAll("[^a-zA-Z0-9._-]", "-");
            if (!filename.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf")) filename += ".pdf";
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/pdf");
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                startActivityForResult(call, intent, "saveLegacyPdf");
                return;
            }
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download");
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IllegalStateException("Unable to create the invoice file.");
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("Unable to write the invoice file.");
                output.write(bytes);
            }
            values.clear();
            values.put(MediaStore.MediaColumns.IS_PENDING, 0);
            if (getContext().getContentResolver().update(uri, values, null, null) < 1) {
                throw new IllegalStateException("Unable to finalize the invoice file.");
            }
            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            if (uri != null) {
                try { getContext().getContentResolver().delete(uri, null, null); }
                catch (Exception ignored) { /* Keep the original save error. */ }
            }
            call.reject(error.getMessage() == null ? "Unable to save invoice." : error.getMessage());
        }
    }

    @ActivityCallback
    private void saveLegacyPdf(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Invoice save cancelled.", "CANCELLED");
            return;
        }
        Uri uri = result.getData().getData();
        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
            if (output == null) throw new IllegalStateException("Unable to write the invoice file.");
            output.write(Base64.decode(call.getString("base64", ""), Base64.DEFAULT));
            JSObject saved = new JSObject();
            saved.put("uri", uri.toString());
            call.resolve(saved);
        } catch (Exception error) {
            try { getContext().getContentResolver().delete(uri, null, null); }
            catch (Exception ignored) { /* Keep the original save error. */ }
            call.reject(error.getMessage() == null ? "Unable to save invoice." : error.getMessage());
        }
    }
}
