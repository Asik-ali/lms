package com.lms.app;

import android.graphics.Bitmap;
import android.net.http.SslError;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.TextView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private View connectionScreen;
    private String retryUrl;
    private boolean pageFailed;

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
        super.onResume();
    }

    @Override
    protected void load() {
        super.load();
        ProtectedMediaChromeClient.install(this, bridge);
        retryUrl = bridge.getAppUrl();
        connectionScreen = getLayoutInflater().inflate(R.layout.connection_error, null);
        addContentView(connectionScreen, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        connectionScreen.setVisibility(View.GONE);
        Button retry = connectionScreen.findViewById(R.id.connection_retry);
        retry.setOnClickListener(view -> {
            retry.setEnabled(false);
            bridge.getWebView().loadUrl(retryUrl);
        });

        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                android.net.Uri url = request.getUrl();
                String scheme = url.getScheme();
                if (!request.isForMainFrame()) {
                    // Embedded players may navigate within their own frame.
                    return !("https".equals(scheme) || "http".equals(scheme) || "about".equals(scheme) || "blob".equals(scheme));
                }
                android.net.Uri app = android.net.Uri.parse(bridge.getAppUrl());
                return !(app.getScheme().equals(scheme)
                    && app.getHost().equals(url.getHost()) && app.getPort() == url.getPort());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                pageFailed = false;
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) {
                    super.onReceivedError(view, request, error);
                    return;
                }
                int code = error.getErrorCode();
                boolean connectionError = code == ERROR_HOST_LOOKUP || code == ERROR_CONNECT || code == ERROR_TIMEOUT;
                showConnectionError(request.getUrl().toString(), connectionError);
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (!request.isForMainFrame()) {
                    super.onReceivedHttpError(view, request, response);
                    return;
                }
                showConnectionError(request.getUrl().toString(), false);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                // SSL errors from embedded media must not hide the entire app.
                if (error.getUrl() != null && error.getUrl().equals(view.getUrl())) showConnectionError(null, false);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                if (!pageFailed) {
                    connectionScreen.setVisibility(View.GONE);
                    view.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                retry.setEnabled(true);
            }
        });
    }

    private void showConnectionError(String url, boolean connectionError) {
        pageFailed = true;
        if (url != null) retryUrl = url;
        TextView title = connectionScreen.findViewById(R.id.connection_title);
        TextView message = connectionScreen.findViewById(R.id.connection_message);
        title.setText(connectionError ? R.string.no_internet_title : R.string.connection_error_title);
        message.setText(connectionError ? R.string.no_internet_message : R.string.connection_error_message);
        connectionScreen.findViewById(R.id.connection_retry).setEnabled(true);
        bridge.getWebView().setVisibility(View.INVISIBLE);
        connectionScreen.setVisibility(View.VISIBLE);
    }
}
