const aliases = {
  aralie: "abigail rachel", delynn: "adeline wijaya", fera: "afera thalia", alya: "alya amanda",
  amanda: "amanda sukma", christy: "angelina christy",
  anindya: "anindya ramadhani", virgi: "astrella virgiananda", lia: "aurellia", lana: "aurhel alana",
  rilly: "bong aprilli", carissa: "carissa dini", erine: "catherina vallencia", cathy: "cathleen nixie",
  elin: "celline thefani", chelsea: "chelsea davina",
  bella: "christabella bonita", oniel: "cornelia vanisa", cynthia: "cynthia yaputera", danella: "dena natalia",
  daisy: "desy natalia", fahira: "fahira putri", rara: "fatimah azzahra", olla: "febriola sinambela",
  feni: "feni fitriyanti", fiony: "fiony alveria", freya: "freya jayawardana", fritzy: "fritzy rosmerian",
  ella: "gabriela abigail", gendis: "gendis mayrannisa", gita: "gita sekar andarini", gracie: "grace octaviani", greesel: "greesella adhalia",
  giaa: "hagia sopia", heidi: "heidi suyangga", eli: "helisma putri", lily: "hillary abigail",
  maira: "humaira ramadhani", indah: "indah cahya", ekin: "jacqueline immanuela", trisha: "jazzlyn trisha",
  jemima: "jemima evodie", jessi: "jessica chandra", lyn: "jesslyn elly", kathrina: "kathrina irene",
  lulu: "lulu salsabila", marsha: "marsha lenathea", maxine: "maxine faye", michie: "michelle alexandra",
  levi: "michelle levia", mikaela: "mikaela kusjanto", muthe: "mutiara azzahra", nayla: "nayla suji",
  nachia: "nina tutachia", intan: "nur intan", oline: "oline manuel", jazzy: "putry jazyta",
  raisha: "raisha syifa", ralyne: "ralyne van irwan", ribka: "ribka budiman", nala: "shabilqis naila",
  sona: "sona kalyana", kimmy: "victoria kimberly",
  suzuha: "suzuha yamane", zukky: "mizuki yamauchi", mizumin: "miyuu mizushima",
  erichan: "eriko hashimoto", kohi: "kohina narita", erii: "erii chiba", yuiyui: "yui oguri",
  ayamin: "ayami nagatomo", haruka: "haruka kurosu", remi: "remi tokunaga",
  masaru: "mayuu masai", yukinee: "yuki hirata",
};

function nameKey(value) {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

export function canonicalMemberName(value) {
  const key = nameKey(value);
  return aliases[key] ?? key;
}

export function memberNameMatches(memberName, query) {
  const member = canonicalMemberName(memberName);
  const search = nameKey(query);
  return !search || member.includes(search) || Object.entries(aliases).some(([nickname, fullName]) => fullName === member && nickname.includes(search));
}

const filenames = {
  "astrella virgiananda": "Astrella_Virgiananda.jpg",
  "bong aprilli": "Bong_Aprilli.jpg",
  "hagia sopia": "Hagia_Sopia.jpg",
  "humaira ramadhani": "Humaira_Ramadhani.jpg",
  "jacqueline immanuela": "Jacqueline_Immanuela.jpg",
  "jemima evodie": "Jemima_Evodie.jpg",
  "maxine faye": "maxine_faye_lee.jpg",
  "mikaela kusjanto": "Mikaela_Kusjanto.jpg",
  "nur intan": "Nur_Intan.jpg",
};

const akb48Photos = {
  "saho iwatate": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100622.jpg",
  "seina fukuoka": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100790.jpg",
  "yui oguri": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100816.jpg",
  "yurina gyoten": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100840.jpg",
  "narumi kuranoo": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100846.jpg",
  "hiyuka sakagawa": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100997.jpg",
  "miu shitao": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100838.jpg",
  "ayane takahashi": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100814.jpg",
  "remi tokunaga": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100993.jpg",
  "serika nagano": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100828.jpg",
  "haruna hashimoto": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100824.jpg",
  "erii chiba": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100927.jpg",
  "haruka kurosu": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100937.jpg",
  "ayami nagatomo": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100943.jpg",
  "orin muto": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100949.jpg",
  "mizuki yamauchi": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100951.jpg",
  "suzuha yamane": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100952.jpg",
  "yuki ota": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100998.jpg",
  "airi sato": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101000.jpg",
  "eriko hashimoto": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101001.jpg",
  "nozomi hatakeyama": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101003.jpg",
  "yuki hirata": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101004.jpg",
  "moka hotei": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101005.jpg",
  "mayuu masai": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101006.jpg",
  "miyuu mizushima": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101007.jpg",
  "sora yamazaki": "https://d2r1lkk9i7row.cloudfront.net/mobile/member/83101008.jpg",
  "yuna akiyama": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101009.jpg",
  "sae arai": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101010.jpg",
  "kasumi kudo": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101011.jpg",
  "hinano kubo": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101012.jpg",
  "yumemi sako": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101013.jpg",
  "kohina narita": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101014.jpg",
  "azuki yagi": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101015.jpg",
  "yui yamaguchi": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101016.jpg",
  "momoka ito": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101017.jpg",
  "kairi okumoto": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101018.jpg",
  "yui kawamura": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101019.jpg",
  "saki oga": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101022.jpg",
  "saki kondo": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101023.jpg",
  "hinata maruyama": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101024.jpg",
  "mao takahashi": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101025.jpg",
  "sayuri tanaka": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101026.jpg",
  "ema makito": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101027.jpg",
  "yu morikawa": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101028.jpg",
  "kiko watanabe": "https://d2r1lkk9i7row.cloudfront.net/hashiranokai/member/83101029.jpg",
};

export function memberPhotoUrl(memberName, groupName) {
  const fullName = canonicalMemberName(memberName);
  const group = String(groupName).toUpperCase();
  if (group.includes("AKB48")) return akb48Photos[fullName] ?? null;
  if (!group.includes("JKT48")) return null;
  const filename = filenames[fullName] ?? `${fullName.replace(/[^a-z0-9]+/g, "_")}.jpg`;
  const source = `https://jkt48.com/api/v1/storages/media/jkt48-member/${filename}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(source)}&w=180&h=180&fit=cover&a=top&output=webp`;
}
