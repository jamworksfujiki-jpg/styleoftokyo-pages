<?php
/**
 * Plugin Name: STYLE OF TOKYO - service → partners 誘導
 * Description: /service/（page ID 242）の本文末尾に、「住宅会社からのご紹介の方へ」専用ページへの誘導ブロックを挿入します。SWELLブロックと同じ構文で記述。
 * Version: 1.0.0
 * Author: STYLE OF TOKYO
 */

if (!defined('ABSPATH')) {
    exit;
}

add_filter('the_content', function ($content) {
    if (!is_singular()) {
        return $content;
    }
    // /service/ のみ対象
    if (get_the_ID() !== 242) {
        return $content;
    }

    $block = <<<HTML

<div class="swell-block-fullWide pc-py-40 sp-py-30 alignfull u-mb-ctrl u-mb-0" style="background-color:#fdf6ec">
  <div class="swell-block-fullWide__inner l-article">
    <div class="wp-block-group txt-width700 u-mb-ctrl u-mb-25"><div class="wp-block-group__inner-container is-layout-constrained wp-block-group-is-layout-constrained">
      <p class="has-text-align-center is-style-balloon_box u-mb-ctrl u-mb-10 has-small-font-size">FOR PARTNERS</p>

      <h2 class="wp-block-heading has-text-align-center is-style-section_ttl u-mb-ctrl u-mb-10"><span class="swl-fz u-fz-l">住宅会社からのご紹介でお越しの方へ</span></h2>

      <p class="has-text-align-center pc-only-center txt u-mb-ctrl u-mb-20">注文住宅をご検討中で、住宅会社様からのご紹介でお越しの方には、<br>土地探しから引き渡しまでを<span class="swl-marker mark_yellow">仲介手数料の範囲で伴走する</span>専用のご案内があります。<br>建築のリスクと資金のリスクを、住宅会社様と二人三脚で同時にみていきます。</p>

      <div class="swell-block-button is-style-btn_normal"><a href="https://styleoftokyo.jp/partners/" class="swell-block-button__link"><span>住宅会社からのご紹介の方へ</span></a></div>
    </div></div>
  </div>
</div>

HTML;

    return $content . $block;
}, 100);
