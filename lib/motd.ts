export const MOTTOS = [
  { text: "Geld ist nicht alles – aber ohne Geld ist alles nichts.", author: "Schopenhauer (vermutlich pleite)" },
  { text: "Spare in der Zeit, dann hast du in der Not... immer noch zu wenig.", author: "Volksweisheit, realistisch" },
  { text: "Wer den Cent nicht ehrt, ist des Euro nicht wert – und kauft trotzdem Avocado-Toast.", author: "Anonymus, gebrochen" },
  { text: "Ein Budget ist ein Plan dafür, wie du Geld ausgibst, das du noch nicht hast.", author: "Jeder Buchhalter je" },
  { text: "Die beste Geldanlage ist die, von der du deiner Partnerin nichts erzählen musst.", author: "Weisheit aus der Praxis" },
  { text: "Reichtum ist relativ. Relativ unerreichbar.", author: "Economist, anonym" },
  { text: "Wer früh spart, hat früher Angst, sein Gespartes auszugeben.", author: "Freud (fast)" },
  { text: "Online-Shopping ist wie Zauberei: Geld weg, Paket da, Freude kurz.", author: "Gen Z, ernst gemeint" },
  { text: "Finanzielle Freiheit bedeutet: Du darfst dir aussuchen, wofür du kein Geld hast.", author: "LinkedIn-Influencer" },
  { text: "Investiere in dich selbst! Hat Starbucks auch gesagt.", author: "Unbekannt, Kaffee in der Hand" },
  { text: "Heute gespart ist morgen... immer noch zu wenig für die Rente.", author: "Deutsche Rentenversicherung" },
  { text: "Der Unterschied zwischen Armut und Sparsamkeit ist das Selfie dabei.", author: "Instagram, 2019" },
  { text: "Wer nichts ausgibt, hat auch nichts erlebt – außer einem prallen Konto.", author: "Dilemma, ungelöst" },
  { text: "April, April – der macht mit deinem Kontostand was er will.", author: "Monat April" },
  { text: "Geld regiert die Welt. Und trotzdem hast du heute Döner gegessen.", author: "Unbekannt, satt" },
  { text: "Man soll aufhören zu essen, wenn es am besten schmeckt. Beim Geldausgeben auch.", author: "Konfuzius (wahrscheinlich)" },
  { text: "Luxus ist, wenn man sich nicht fragt, ob man sich etwas leisten kann – und es trotzdem nicht kauft.", author: "Vorsichtiger Sparfuchs" },
  { text: "Wer den ganzen Tag Ausgaben trackt, ist entweder sehr organisiert oder sehr erschrocken.", author: "Diese App" },
  { text: "Finanzdisziplin heißt: den zweiten Kaffee wollen, aber nur einen trinken. Meist.", author: "Barista, hoffnungsvoll" },
  { text: "Träume sind kostenlos. Der Rest leider nicht.", author: "Kasse, piept" },
  { text: "Haushaltsbuch führen ist wie Tagebuch – nur schmerzhafter.", author: "Jeder hier" },
  { text: "Geld kann man nicht essen. Aber man kann damit Sushi bestellen.", author: "Pragmatiker" },
  { text: "Die Steuer ist die eleganteste Form des Trickbetrugss.", author: "Steuerzahler, anonym" },
  { text: "Wer spart, lebt besser. Wer ausgibt, lebt jetzt.", author: "YOLO-Ökonomie" },
  { text: "Ein leeres Portemonnaie lehrt am besten, was wirklich wichtig ist: ein volles Portemonnaie.", author: "Lebensschule" },
  { text: "Ausgaben sind wie Kalorien – man unterschätzt sie immer.", author: "Ernährungsberater, zweckentfremdet" },
  { text: "Subscriptions kündigen: Die Aufgabe, die jedes Jahresende überlebt.", author: "To-Do-Liste, 3. Jahr" },
  { text: "Niemand hat Geld – alle tun nur so.", author: "Volkswirtschaft für Anfänger" },
  { text: "Wer aufhört zu sparen, fängt an zu genießen. Oder zu bereuen.", author: "Unentschieden" },
  { text: "Dein Konto ist kein Wunschzettel-Validator.", author: "Kontostand, direkt" },
];

export function getDailyMotto() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return MOTTOS[dayOfYear % MOTTOS.length];
}
