import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const android=path.join(root,'android');
const manifestPath=path.join(android,'app','src','main','AndroidManifest.xml');
let manifest=await readFile(manifestPath,'utf8');
if(!manifest.includes('android:hardwareAccelerated='))manifest=manifest.replace('<application','<application android:hardwareAccelerated="true"');
if(!manifest.includes('android:largeHeap='))manifest=manifest.replace('<application','<application android:largeHeap="true"');
manifest=manifest.replace(/android:icon="[^"]+"/,'android:icon="@drawable/app_icon"');
manifest=manifest.replace(/android:roundIcon="[^"]+"/,'android:roundIcon="@drawable/app_icon"');
if(!manifest.includes('android:screenOrientation='))manifest=manifest.replace('<activity','<activity android:screenOrientation="landscape"');
else manifest=manifest.replace(/android:screenOrientation="[^"]+"/,'android:screenOrientation="landscape"');
await writeFile(manifestPath,manifest,'utf8');

const drawable=path.join(android,'app','src','main','res','drawable');
await mkdir(drawable,{recursive:true});
await writeFile(path.join(drawable,'app_icon.xml'),`<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#081526" android:pathData="M0,0h108v108h-108z"/>
  <path android:fillColor="#153F43" android:pathData="M8,80L27,59L47,68L66,48L100,72L100,100L8,100z"/>
  <path android:fillColor="#4E8B43" android:pathData="M8,76L27,55L47,64L66,44L100,68L100,78L66,56L48,75L28,66L8,87z"/>
  <path android:fillColor="#3A2B50" android:pathData="M19,20h45v51h-45z"/>
  <path android:fillColor="#8A5BD8" android:pathData="M24,25h35v41h-35z"/>
  <path android:fillColor="#C657FF" android:pathData="M29,30h25v31h-25z"/>
  <path android:fillColor="#5A1A8A" android:pathData="M34,35h15v21h-15z"/>
  <path android:fillColor="#C9F6FF" android:pathData="M72,18l8,5l-19,32l-8,-5z"/>
  <path android:fillColor="#47C9ED" android:pathData="M69,19l6,4l-17,28l-6,-4z"/>
  <path android:fillColor="#F4C34E" android:pathData="M52,48l18,11l-4,7l-18,-11zM44,53l7,4l-12,20l-7,-4z"/>
  <path android:fillColor="#9FD85B" android:pathData="M75,69c9,-10 19,-7 22,-4c-8,12 -18,14 -22,4z"/>
  <path android:fillColor="#58A74C" android:pathData="M76,69c4,2 8,6 9,14h-5c0,-6 -2,-10 -4,-14z"/>
  <path android:fillColor="#FF6256" android:pathData="M85,48c7,0 12,5 12,12s-5,12 -12,12s-12,-5 -12,-12s5,-12 12,-12z"/>
  <path android:fillColor="#FFF0A0" android:pathData="M78,56h14v6h-14z"/>
</vector>`,'utf8');

const javaDir=path.join(android,'app','src','main','java','com','voxelepoch','sixrealms');
await mkdir(javaDir,{recursive:true});
await writeFile(path.join(javaDir,'MainActivity.java'),`package com.voxelepoch.sixrealms;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    super.onCreate(savedInstanceState);
    getWindow().setBackgroundDrawableResource(android.R.color.black);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
    if (getBridge() != null && getBridge().getWebView() != null) {
      WebView webView = getBridge().getWebView();
      webView.setBackgroundColor(android.graphics.Color.BLACK);
      webView.getSettings().setDomStorageEnabled(true);
      webView.getSettings().setDatabaseEnabled(true);
      webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
    immersive();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) immersive();
  }

  private void immersive() {
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
      View.SYSTEM_UI_FLAG_FULLSCREEN |
      View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
      View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
      View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    );
  }
}
`,'utf8');

const values=path.join(android,'app','src','main','res','values');
await mkdir(values,{recursive:true});
await writeFile(path.join(values,'strings.xml'),`<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="app_name">方块纪元：六境与异界</string>
  <string name="title_activity_main">方块纪元：六境与异界</string>
  <string name="package_name">com.voxelepoch.sixrealms</string>
  <string name="custom_url_scheme">com.voxelepoch.sixrealms</string>
</resources>
`,'utf8');
console.log('Android project patched: landscape, immersive, large heap, hardware acceleration and custom launcher icon.');
