const aliases = {
  aralie: "abigail rachel", delynn: "adeline wijaya", fera: "afera thalia", christy: "angelina christy",
  anindya: "anindya ramadhani", virgi: "astrella virgiananda", lia: "aurellia", lana: "aurhel alana",
  rilly: "bong aprilli", carissa: "carissa dini", erine: "catherina vallencia", elin: "celline thefani",
  bella: "christabella bonita", oniel: "cornelia vanisa", cynthia: "cynthia yaputera", danella: "dena natalia",
  daisy: "desy natalia", fahira: "fahira putri", rara: "fatimah azzahra", olla: "febriola sinambela",
  feni: "feni fitriyanti", fiony: "fiony alveria", freya: "freya jayawardana", fritzy: "fritzy rosmerian",
  ella: "gabriela abigail", gita: "gita sekar andarini", gracie: "grace octaviani", greesel: "greesella adhalia",
  giaa: "hagia sopia", heidi: "heidi suyangga", eli: "helisma putri", lily: "hillary abigail",
  maira: "humaira ramadhani", indah: "indah cahya", ekin: "jacqueline immanuela", trisha: "jazzlyn trisha",
  jemima: "jemima evodie", jessi: "jessica chandra", lyn: "jesslyn elly", kathrina: "kathrina irene",
  lulu: "lulu salsabila", marsha: "marsha lenathea", maxine: "maxine faye", michie: "michelle alexandra",
  levi: "michelle levia", mikaela: "mikaela kusjanto", muthe: "mutiara azzahra", nayla: "nayla suji",
  nachia: "nina tutachia", intan: "nur intan", oline: "oline manuel", jazzy: "putry jazyta",
  raisha: "raisha syifa", ralyne: "ralyne van irwan", ribka: "ribka budiman", nala: "shabilqis naila",
  sona: "sona kalyana", kimmy: "victoria kimberly",
};

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
  const key = String(memberName).trim().toLocaleLowerCase("id-ID");
  const fullName = aliases[key] ?? key;
  const filename = filenames[fullName] ?? `${fullName.replace(/[^a-z0-9]+/g, "_")}.jpg`;
  const source = `https://jkt48.com/api/v1/storages/media/jkt48-member/${filename}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(source)}&w=180&h=180&fit=cover&a=top&output=webp`;
}
