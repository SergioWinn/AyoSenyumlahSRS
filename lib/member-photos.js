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

export function memberPhotoUrl(memberName, groupName) {
  if (!String(groupName).toUpperCase().includes("JKT48")) return null;
  const fullName = canonicalMemberName(memberName);
  const filename = filenames[fullName] ?? `${fullName.replace(/[^a-z0-9]+/g, "_")}.jpg`;
  const source = `https://jkt48.com/api/v1/storages/media/jkt48-member/${filename}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(source)}&w=180&h=180&fit=cover&a=top&output=webp`;
}
