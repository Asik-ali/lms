package com.lms.app;

import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

final class ProtectedMediaChromeClient extends BridgeWebChromeClient {
    private final MainActivity activity;
    private final Bridge bridge;
    private final OnBackPressedCallback back;
    private View fullscreen;
    private CustomViewCallback callback;
    private int systemUi;

    static void install(MainActivity activity, Bridge bridge) {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        bridge.getWebView().getSettings().setSupportMultipleWindows(true);
        bridge.getWebView().setWebChromeClient(new ProtectedMediaChromeClient(activity, bridge));
    }

    private ProtectedMediaChromeClient(MainActivity activity, Bridge bridge) {
        super(bridge);
        this.activity = activity;
        this.bridge = bridge;
        back = new OnBackPressedCallback(false) {
            @Override public void handleOnBackPressed() { onHideCustomView(); }
        };
        activity.getOnBackPressedDispatcher().addCallback(activity, back);
    }

    @Override
    public boolean onCreateWindow(WebView view, boolean dialog, boolean userGesture, Message result) {
        // Provider popups must never expose a file in another browser or app.
        return false;
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback nextCallback) {
        if (fullscreen != null) { nextCallback.onCustomViewHidden(); return; }
        fullscreen = view;
        callback = nextCallback;
        ViewGroup decor = (ViewGroup) activity.getWindow().getDecorView();
        systemUi = decor.getSystemUiVisibility();
        decor.addView(view, new ViewGroup.LayoutParams(-1, -1));
        bridge.getWebView().setVisibility(View.GONE);
        decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        back.setEnabled(true);
    }

    @Override
    public void onHideCustomView() {
        if (fullscreen == null) return;
        ViewGroup decor = (ViewGroup) activity.getWindow().getDecorView();
        decor.removeView(fullscreen);
        fullscreen = null;
        decor.setSystemUiVisibility(systemUi);
        bridge.getWebView().setVisibility(View.VISIBLE);
        back.setEnabled(false);
        CustomViewCallback previous = callback;
        callback = null;
        previous.onCustomViewHidden();
    }
}
