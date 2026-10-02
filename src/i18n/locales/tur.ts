import type { Translation } from './eng'

export const tur: Translation = {
  'app.name': 'Heavier',
  'app.tagline': 'İçgüdüne güven. Hangisi daha ağır, tahmin et.',

  'meta.description':
    'İki nesne, tek soru: hangisi daha ağır? Sekiz tur boyunca sezgini sına.',

  'settings.language': 'Dil',
  'settings.unit': 'Birim',
  'a11y.languageSelect': 'Dil seç',
  'a11y.unitSelect': 'Ağırlık birimi seç',

  'home.lead': 'İki nesne. Tek soru.',
  'home.headline': 'Hangisi daha ağır?',
  'home.rule':
    'Sekiz tur, hep başa baş: ağır nesne, hafif olandan en fazla yüzde 54 kadar ağır.',
  'home.start': 'Oyuna başla',
  'home.categories': 'Tartacağın nesneler',
  'home.categoryCount': '{count} nesne',
  'home.guessStart': 'Ağırlığı Tahmin Et',
  'home.guessRule':
    'Her seferinde tek bir nesne: ağırlığını tahmin et ve ne kadar yaklaştığını gör. Sekiz tur, sonra genel isabet oranın.',

  'game.round': 'Tur',
  'game.prompt': 'Hangisi daha ağır?',
  'game.choose': '{name} seç',
  'game.next': 'Sonraki tur',
  'game.finish': 'Puanını gör',
  'game.heavier': 'Daha ağır',
  'game.correct': 'Doğru',
  'game.wrong': 'Olmadı',
  'game.yourPick': 'Senin seçimin',
  'game.score': 'Puan',

  'guess.prompt': 'Bunun ne kadar ağırlığında olduğunu düşünüyorsun?',
  'guess.inputLabel': 'Tahminin',
  'guess.a11yInput': 'Tahmini ağırlığını gir',
  'guess.submit': 'Tahmini gönder',
  'guess.next': 'Sonraki tur',
  'guess.finish': 'Sonuçlarını gör',
  'guess.yourGuess': 'Tahminin',
  'guess.actualWeight': 'Gerçek ağırlık',
  'guess.percentOff': '{percent} fark',
  'guess.tier.perfect': 'Kusursuz',
  'guess.tier.veryGood': 'Çok iyi',
  'guess.tier.good': 'İyi',
  'guess.tier.close': 'Yakın',
  'guess.tier.far': 'Uzak',
  'guess.exact.bullseye': 'Tam İsabet!',
  'guess.exact.spotOn': 'Tam Üstüne Bastın!',

  'score.eyebrow': 'Oyun bitti',
  'score.correctOf': '{total} soruda {correct} doğru',
  'score.headline.perfect': 'Kusursuz.',
  'score.headline.great': 'Sezgilerin güçlü.',
  'score.headline.good': 'Hiç fena değil.',
  'score.headline.low': 'Ağırlıklar yanıltıcı.',
  'score.playAgain': 'Tekrar oyna',
  'score.home': 'Başa dön',
  'score.share': 'Sonucu paylaş',
  'score.shareCopied': 'Panoya kopyalandı',

  'guessScore.eyebrow': 'Ağırlığı Tahmin Et — bitti',
  'guessScore.accuracyLabel': 'Genel isabet oranı',
  'guessScore.playAgain': 'Tekrar oyna',
  'guessScore.home': 'Başa dön',

  'dispute.open': 'Ağırlık yanlış mı?',
  'dispute.step1': 'Hangi ağırlık sana yanlış geldi?',
  'dispute.step2': '{name} şöyle olmalı',
  'dispute.heavier': 'Daha ağır',
  'dispute.lighter': 'Daha hafif',
  'dispute.thanks': 'Teşekkürler, inceleyeceğiz.',
  'dispute.close': 'Kapat',
  'dispute.back': 'Geri',

  'error.title': 'Bir şeyler ters gitti',
  'error.noData': 'Nesne verisi yüklenemedi.',
  'error.noPairs': 'Veride karşılaştırılabilir nesne çifti bulunamadı.',
  'error.notEnoughPairs':
    'Tam bir oyun kurmaya yetecek kadar karşılaştırılabilir nesne çifti henüz yok.',
  'error.retry': 'Tekrar dene',
  'error.missingImage': 'Görsel yok',
  'guessError.notEnoughObjects': 'Tam bir tur kurmaya yetecek kadar nesne verisi henüz yok.',

  'category.animals': 'Hayvanlar',
  'category.foods': 'Yiyecekler',
  'category.stuff': 'Eşyalar',
  'category.vehicles': 'Araçlar',

  'faq.title': 'Sık sorulan sorular',

  'faq.q1': 'Oyun nasıl işliyor?',
  'faq.a1':
    'Her oyun sekiz turdan oluşur. Her turda yan yana iki nesne görürsün ve hangisinin daha ağır olduğunu düşünüyorsan onu seçersin; süre tutulmaz, istediğin kadar düşünebilirsin. Seçimini yaptığın anda iki nesnenin gerçek ağırlığı açılır; böylece bir sonraki tura geçmeden ne kadar yaklaştığını görürsün.',

  'faq.q2': 'Ağırlıklar nasıl belirleniyor?',
  'faq.a2':
    'Her ağırlık, aynı nesne için ayrı ayrı sorgulanan dört farklı yapay zekâ motoruyla araştırıldı. Gelen yanıtlar yan yana karşılaştırıldı, ortalaması alındı ve sonuç sade bir değere yuvarlandı. Oyunun kullandığı sayı bu ortalamadır; böylece her nesne, hangi kaynağa denk gelindiğine göre değil, aynı ölçüyle değerlendirilir.',

  'faq.q3': 'Ağırlıklar birebir doğru mu?',
  'faq.a3':
    'Hayır, öyle olma iddiaları da yok. Her değer, o tür nesne için tipik bir referans ağırlıktır; çünkü gerçek bir nesne boyutuna, cinsine, yaşına, modeline ya da ne kadar dolu olduğuna göre değişir. Aynı cinsten iki köpek arasında birkaç kilo fark olabilir. Sayılar adil bir karşılaştırma kurmaya yetecek kadar doğrudur, tek bir bireyi belgelemeye değil.',

  'faq.q4': 'Bazı nesneler neden birbiriyle karşılaştırılıyor?',
  'faq.a4':
    'Çünkü başa baş bir karşılaştırma daha iyi bir soru olur. Oyun yalnızca ağırlıkları birbirinden yaklaşık yüzde 54’ten fazla uzaklaşmayan nesneleri eşleştirir; yani sana hiçbir zaman tüy mü ağır, kamyon mu diye sorulmaz. Bu kural kategorileri bilerek yok sayar: ağırlıkları birbirine yakın olduğu sürece bir hayvanla bir aracı karşılaştırmak gayet geçerli bir sorudur.',

  'faq.q5': 'Hangi birimleri kullanabilirim?',
  'faq.a5':
    'Üstteki seçici tüm oyunu kilogram ile libre arasında değiştirir ve tercihin bir sonraki gelişin için hatırlanır. Dönüşümde bilerek sade tutulmuş 1 kg = 2,2 lb kullanılır. Bir kilogramın altındaki değerler gram olarak gösterilir; böylece bir kiraz 0,01 kg değil 10 g diye okunur. Birim yalnızca görünümle ilgilidir: hangi nesnenin gerçekten ağır olduğunu asla değiştirmez.',

  'faq.q6': 'Puanım nasıl hesaplanıyor?',
  'faq.a6':
    'Her doğru cevap bir puan değerinde, toplam sekiz soru üzerinden. Son tur bittiğinde kaç doğru yaptığını ve aynı sonucu yüzde olarak görürsün. Hiçbir tur diğerinden daha değerli değil, yanlışın ek bir cezası da yok: zor bir soru da kolay bir soru da tam olarak aynı puanı getirir.',

  'faq.q7': 'Bir nesnenin ağırlığına itiraz edebilir miyim?',
  'faq.a7':
    'Evet, hatta bunu çok isteriz. Cevap açıldıktan sonra “Ağırlık yanlış mı?” düğmesi, sana yanlış görünen nesneyi seçip daha ağır mı yoksa daha hafif mi olması gerektiğini söyleme imkânı verir. Değerler araştırılmış ortalamalar olduğu için hepsi kusursuz olmayabilir; senin bildirimin de tam olarak verileri gözden geçirmemizi, güncellememizi ve iyileştirmemizi sağlayan şeydir. Bir şey sana yanlış geliyorsa söylemeye değer.',

  'faq.q8': 'Sorular ne sıklıkla değişiyor?',
  'faq.a8':
    'Her yeni oyun, sen başlattığın anda sekiz soruluk yepyeni bir set oluşturur. Eşleşmeler nesne listesinin tamamından rastgele çekilir, bu yüzden arka arkaya iki oyunun birbirine benzemesi pek olası değildir. Beklemen gereken günlük bir set ya da ezberlenecek sabit bir sıra yok.',

  'faq.q9': 'Tekrar oynayabilir miyim?',
  'faq.a9':
    'İstediğin kadar. Oyun bitince “Tekrar oyna” hemen sekiz yeni soruyla yeni bir oyun başlatır; üstteki logo ise istediğin an seni başlangıca döndürür. Kilitli bir şey yok; sınır, can ya da bekleme süresi de yok.',

  'faq.q10': 'Buy Me a Coffee nedir?',
  'faq.a10':
    'Projeyi desteklemenin küçük ve tamamen isteğe bağlı bir yolu. Heavier ücretsizdir; reklam da yok, hesap da. Oyunu sevdiysen ve gelişmeye devam etmesine yardım etmek istersen bir kahve ısmarlamak bunun nazik bir yolu. Hiçbir şey vermemek hiçbir şeyi değiştirmez: oyun iki durumda da bire bir aynı kalır.',

  'footer.coffee': 'Bana bir kahve ısmarla',

  'bento.feature.line1': 'Yapım Aşamasında',
  'bento.feature.line2': 'Çok Yakında',
  'bento.contact.line1': 'Bize Ulaşın',
  'bento.contact.line2': 'Star Games',
  'bento.coffee.title': 'Bana bir kahve ısmarla',
  'bento.coffee.body': 'Heavier ücretsiz, reklamsız ve üyeliksiz. Bir kahve büyümesine yardım eder.',
  'bento.faq.before': '',
  'bento.faq.accent': 'Sıkça sorulan soruları',
  'bento.faq.after': ' görüntülemek için buraya tıklayın',

}
