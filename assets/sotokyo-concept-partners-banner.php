<?php
/**
 * Plugin Name: STYLE OF TOKYO - PARTNERS Banner
 * Description: ホームページ末尾の「提携会計事務所募集」バナーの下に、FOR PARTNERS（住宅会社からのご紹介の方へ）バナーを1枚表示します。CONCEPTバナーは2026-06-08削除済み（ユーザー指示）。
 * Version: 1.1.0
 * Author: STYLE OF TOKYO
 */

if (!defined('ABSPATH')) {
    exit;
}

add_filter('the_content', function ($content) {
    if (!is_singular()) {
        return $content;
    }
    if (get_the_ID() !== 7) {
        return $content;
    }

    $partners_img = 'https://styleoftokyo.jp/partners/assets/partners-banner.png';

    $banner = <<<HTML

<div class="swell-block-fullWide alignfull u-mb-ctrl u-mb-0" style="background-color:#f7f7f7;padding-top:0;padding-bottom:24px">
  <div class="swell-block-fullWide__inner l-article">
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
}, 100);
