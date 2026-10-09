/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => fs.existsSync(path.join(root, file));

describe('React Native 0.87 Android baseline', () => {
  it('uses the RN 0.87 Android SDK and Kotlin toolchain', () => {
    const gradle = read('android/build.gradle');
    expect(gradle).toContain('buildToolsVersion = "37.0.0"');
    expect(gradle).toContain('minSdkVersion = 24');
    expect(gradle).toContain('compileSdkVersion = 37');
    expect(gradle).toContain('targetSdkVersion = 36');
    expect(gradle).toContain('ndkVersion = "27.1.12297006"');
    expect(gradle).toContain('kotlinVersion = "2.2.0"');
  });

  it('uses Gradle 9 and the React Native settings plugin', () => {
    expect(read('android/gradle/wrapper/gradle-wrapper.properties')).toContain(
      'gradle-9.8.0-bin.zip',
    );
    const settings = read('android/settings.gradle');
    expect(settings).toContain('com.facebook.react.settings');
    expect(settings).toContain('@react-native/gradle-plugin');
  });

  it('enables Hermes and the New Architecture', () => {
    const properties = read('android/gradle.properties');
    expect(properties).toContain('newArchEnabled=true');
    expect(properties).toContain('hermesEnabled=true');
    expect(properties).toContain('android.builtInKotlin=false');
    expect(properties).toContain('android.newDsl=false');
  });

  it('uses tz.co.oto and the modern React Native Gradle plugin', () => {
    const app = read('android/app/build.gradle');
    expect(app).toContain('apply plugin: "org.jetbrains.kotlin.android"');
    expect(app).toContain('apply plugin: "com.facebook.react"');
    expect(app).toContain('namespace "tz.co.oto"');
    expect(app).toContain('applicationId "tz.co.oto"');
    expect(app).toContain('implementation("com.facebook.react:react-android")');
    expect(app).toContain('implementation("com.facebook.react:hermes-android")');
  });

  it('uses the current Kotlin application entry points', () => {
    const activity = read(
      'android/app/src/main/java/tz/co/oto/MainActivity.kt',
    );
    const application = read(
      'android/app/src/main/java/tz/co/oto/MainApplication.kt',
    );
    expect(activity).toContain('package tz.co.oto');
    expect(activity).toContain('getMainComponentName(): String = "oto"');
    expect(application).toContain('package tz.co.oto');
    expect(application).toContain('loadReactNative(this)');
  });

  it('removes the legacy RN 0.70 Android architecture scaffolding', () => {
    expect(exists('android/app/src/main/java/tz/co/oto/MainActivity.java')).toBe(
      false,
    );
    expect(
      exists('android/app/src/main/java/tz/co/oto/MainApplication.java'),
    ).toBe(false);
    expect(exists('android/app/src/main/jni/Android.mk')).toBe(false);
  });
});
