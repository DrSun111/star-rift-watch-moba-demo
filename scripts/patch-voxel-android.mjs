import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const android=path.join(root,'android');
const manifestPath=path.join(android,'app','src','main','AndroidManifest.xml');
let manifest=await readFile(manifestPath,'utf8');
if(!manifest.includes('android:hardwareAccelerated='))manifest=manifest.replace('<application','<application android:hardwareAccelerated="true"');
if(!manifest.includes('android:screenOrientation='))manifest=manifest.replace('<activity','<activity android:screenOrientation="landscape"');
await writeFile(manifestPath,manifest,'utf8');

const javaDir=path.join(android,'app','src','main','java','com','voxelepoch','sixrealms');
await mkdir(javaDir,{recursive:true});
await writeFile(path.join(javaDir,'MainActivity.java'),`package com.voxelepoch.sixrealms;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
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
console.log('Android project patched: landscape + immersive + keep-screen-on.');
