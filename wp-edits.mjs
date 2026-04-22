// Edit definitions for concept/about/service pages.
// Each page has an array of {name, find, replace} edits.
// find MUST match exactly once in the content — enforced in dry-run.

export const EDITS = {
  concept: {
    id: 222,
    edits: [
      {
        name: 'CONCEPT-1 catchcopy',
        find: '<strong><span class="swl-fz u-fz-l">タイパ・コスパ良く</span></strong>[spbr]<strong><span class="swl-fz u-fz-l">住まいを取得しましょう。</span></strong>',
        replace: '<strong><span class="swl-fz u-fz-l">不動産のことなら、</span></strong>[spbr]<strong><span class="swl-fz u-fz-l">何でもご相談ください。</span></strong>',
      },
      {
        name: 'CONCEPT-2 リード文',
        find: '住宅取得への想いは千差万別です。<br>全ての方への幸せな住まい取得をサポートできるかはわかりませんが、[pcbr]<strong><span class="swl-marker mark_yellow">プロと伴走することでストレスなく効率的に進む</span></strong>ことが多いのも事実です。',
        replace: '購入・売却・住み替え・相続・家じまいまで、<br>不動産に関するお悩みは人それぞれです。[pcbr]どんなことでも、<strong><span class="swl-marker mark_yellow">プロと伴走することでストレスなく・効率よく解決</span></strong>できます。',
      },
      {
        name: 'CONCEPT-3 サブ見出し',
        find: '想いの整理と決断はお客様の担当。[spbr]専門分野はプロと伴走する住宅取得',
        replace: '想いの整理と決断はお客様の担当。[spbr]専門分野はプロと伴走する不動産サポート',
      },
      {
        name: 'CONCEPT-4 サブリード文',
        find: 'スタイルオブ東京では、単発でもフルサポートでもお引き受けします。',
        replace: 'スタイルオブ東京では、購入・売却・建築・相続など、単発のご相談からフルサポートまでお引き受けします。',
      },
    ],
  },

  about: {
    id: 239,
    edits: [
      {
        name: 'ABOUT-1 リード文（中間部分のみ差替）',
        find: '理想の住まいを手に入れるまでには、煩雑な手続きや難しい専門用語が飛び交う打ち合わせなどが必要になり、[pcbr]心も体もクタクタになってしまいます。スタイルオブ東京はそんなお客様の声にお応えし、<br>住まいに関する無料相談から実際の購入・リノベーション・リフォームに至るまでの[pcbr]きめ細やかなトータルコーディネートを行っています。',
        replace: '不動産に関するお悩みは多岐にわたります。購入・売却・住み替え・相続・空き家・建築リフォームなど、[pcbr]どんなことでもまずはお気軽にご相談ください。スタイルオブ東京は、<br>東京を中心に累計2,000件以上の不動産相談をお受けしてきた専門家として、[pcbr]お客様一人ひとりに寄り添ったサポートをご提供します。',
      },
      {
        name: 'ABOUT-2 箇条書き（リスト全体を差替）',
        find: `<ul class="wp-block-list is-style-check_list txt"><!-- wp:list-item -->
<li>まずは何から始めればいいか教えて欲しい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>新築、注文住宅、リフォーム、どれが自分に合っているか分からない</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>買い替えのいい方法が知りたい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>住宅ローンや月々の支払いが不安なので資金計画について教えて欲しい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>不動産や建築業者を一緒に探して欲しい</li>
<!-- /wp:list-item --></ul>`,
        replace: `<ul class="wp-block-list is-style-check_list txt"><!-- wp:list-item -->
<li>まずは何から始めればいいか教えてほしい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>購入か賃貸か、新築か中古か迷っている</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>住み替えのタイミングや段取りが分からない</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>実家が空き家になりそうで、売る・貸す・残すを整理したい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>相続・離婚など複雑な不動産の問題がある</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>他の不動産会社の説明が信用できず、セカンドオピニオンがほしい</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>建築・リフォーム会社の見積もりが妥当かチェックしてほしい</li>
<!-- /wp:list-item --></ul>`,
      },
    ],
  },

  top: {
    id: 7,
    edits: [
      {
        name: 'TOP card1 heading',
        find: '<h4 class="sot-worry-title">何から始めれば<br>いいか分からない</h4>',
        replace: '<h4 class="sot-worry-title">不動産、何から始めれば<br>いいか分からない</h4>',
      },
      {
        name: 'TOP card1 desc',
        find: '<p class="sot-worry-desc">初めてのマイホーム購入、<br>資金計画から物件選びまで</p>',
        replace: '<p class="sot-worry-desc">購入・売却・相続…まず何をすべきか、<br>プロが一緒に整理します</p>',
      },
      {
        name: 'TOP card2 heading',
        find: '<h4 class="sot-worry-title">売って買う？<br>先に買う？</h4>',
        replace: '<h4 class="sot-worry-title">売って買う？先に買う？<br>住み替えが不安</h4>',
      },
      {
        name: 'TOP card2 desc',
        find: '<p class="sot-worry-desc">住み替えのタイミングと<br>段取りを一緒に設計</p>',
        replace: '<p class="sot-worry-desc">売却・購入のタイミングと段取りを、<br>プロが中立な立場で一緒に設計</p>',
      },
      {
        name: 'TOP card3 desc (heading unchanged per docx)',
        find: '<p class="sot-worry-desc">売る？貸す？家族の意見を<br>整理して最善策を提案</p>',
        replace: '<p class="sot-worry-desc">売る？貸す？相続は？家族の意見を整理して、<br>東京の不動産プロが最善策を提案</p>',
      },
      {
        name: 'TOP card4 heading',
        find: '<h4 class="sot-worry-title">建築会社選びが<br>不安</h4>',
        replace: '<h4 class="sot-worry-title">建築・リフォーム<br>会社選びが不安</h4>',
      },
      {
        name: 'TOP card4 desc',
        find: '<p class="sot-worry-desc">中立の立場で見積もりや<br>進め方をサポート</p>',
        replace: '<p class="sot-worry-desc">中立の立場で相見積もり・価格交渉・進め方をサポート。<br>騙されない家づくりのために</p>',
      },
      {
        name: 'TOP card5 heading',
        find: '<h4 class="sot-worry-title">何をどこに<br>聞けばいいか不明</h4>',
        replace: '<h4 class="sot-worry-title">不動産のことを<br>気軽に聞ける場所がない</h4>',
      },
      {
        name: 'TOP card5 desc',
        find: '<p class="sot-worry-desc">相続・離婚・複雑な不動産問題も<br>まず話を整理します</p>',
        replace: '<p class="sot-worry-desc">相続・離婚・売却・購入…複雑な問題も、<br>セカンドオピニオンとしてまず話を整理します</p>',
      },
    ],
  },

  service: {
    id: 242,
    edits: [
      {
        name: 'SERVICE-1 冒頭リード文',
        find: 'スタイルオブ東京は、<br>相談・ファイナンス・物件サポート・折衝、契約・建築会社紹介・アフターサービスを<br>すべてワンストップでご提供いたします。',
        replace: '不動産の購入・売却・住み替え・建築・相続まで、<br>お客様に関わるあらゆる不動産のお悩みをワンストップでサポートします。<br>相談だけでもOK。まずはZoom無料相談からどうぞ。',
      },
      {
        name: 'SERVICE-2 STEP01 説明文',
        find: '不動産購入はわからないことだらけ・・。<br>購入を考えてみたけど、<span class="swl-marker mark_yellow">予算、物件の探し方や選び方などいざとなると不安がいっぱい。</span><br>そもそも買わない方がいいのか?またはいつ買うのか?<br>何を相談すればいいのかわからない…など、<span class="swl-marker mark_yellow">どんなことでもご相談いただけます。</span>',
        replace: '不動産のことはわからないことだらけ。<br>購入・売却・相続・空き家・住み替えなど、<span class="swl-marker mark_yellow">どんなお悩みでも気軽にご相談ください。</span><br>「何を聞けばいいかわからない」という状態でも大丈夫です。<br>中立の立場でお客様の状況を整理し、<span class="swl-marker mark_yellow">最適な道筋をご提案します。</span>',
      },
    ],
  },
};
