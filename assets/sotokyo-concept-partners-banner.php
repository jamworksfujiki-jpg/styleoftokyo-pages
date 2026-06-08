<?php
/**
 * Plugin Name: STYLE OF TOKYO - CONCEPT / PARTNERS Banner
 * Description: ホームページ末尾の「提携会計事務所募集」バナーの下に、CONCEPT（スタイルオブ東京とは）と FOR PARTNERS（住宅会社からのご紹介の方へ）の2枚のバナーを表示します。削除すれば元に戻ります。
 * Version: 1.0.0
 * Author: STYLE OF TOKYO
 */

if (!defined('ABSPATH')) {
    exit;
}

add_filter('the_content', function ($content) {
    // 対象はフロントページ（post ID 7）のみ
    if (!is_singular()) {
        return $content;
    }
    if (get_the_ID() !== 7) {
        return $content;
    }

    // 画像URLは、サーバアップロード先に合わせて書き換えてください。
    // ▼パターン1：zeirishi-banner.png と同じ /<slug>/assets/ ディレクトリにFTPアップロードする場合
    $concept_img  = 'https://styleoftokyo.jp/concept/assets/concept-banner.png';
    $partners_img = 'https://styleoftokyo.jp/partners/assets/partners-banner.png';
    // ▼パターン2：WordPress メディアライブラリにアップロードした場合は、以下のように差し替え
    // $concept_img  = 'https://styleoftokyo.jp/wp-content/uploads/2026/06/concept-banner.png';
    // $partners_img = 'https://styleoftokyo.jp/wp-content/uploads/2026/06/partners-banner.png';

    $banner = <<<HTML

<div class="swell-block-fullWide alignfull u-mb-ctrl u-mb-0" style="background-color:#f7f7f7;padding-top:0;padding-bottom:24px">
  <div class="swell-block-fullWide__inner l-article">
    <div class="swell-block-bannerLink" style="margin:0 0 16px 0">
      <a href="https://styleoftokyo.jp/concept/" class="c-bannerLink" style="background:none">
        <figure class="c-bannerLink__figure" style="height:auto">
          <img decoding="async" src="{$concept_img}" alt="スタイルオブ東京とは - 不動産エージェントの仕事" class="c-bannerLink__img" style="width:100%;height:auto;display:block;border-radius:6px">
        </figure>
        <div class="c-bannerLink__text"><div class="c-bannerLink__title"></div></div>
      </a>
    </div>
    <div class="swell-block-bannerLink" style="margin:0">
      <a href="https://styleoftokyo.jp/partners/" class="c-bannerLink" style="background:none">
        <figure class="c-bannerLink__figure" style="height:auto">
          <img decoding="async" src="{$partners_img}" alt="住宅会社からのご紹介の方へ - わたしたちの仕事" class="c-bannerLink__img" style="width:100%;height:auto;display:block;border-radius:6px">
        </figure>
        <div class="c-bannerLink__text"><div class="c-bannerLink__title"></div></div>
      </a>
    </div>
  </div>
</div>

HTML;

    return $content . $banner;
}, 100); // priority=100 で、zeirishi-banner (priority=99) の直後に挿入される
