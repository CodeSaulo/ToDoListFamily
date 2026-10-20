// Recetas sugeridas: sencillas, saludables y con ingredientes fáciles de encontrar en México.

export type Receta = {
  title: string;
  minutes: number;
  finde: boolean; // ideal para fin de semana
  slot: "desayuno" | "comida" | "cena";
  ingredients: string[];
  steps: string[];
};

export const RECETAS: Receta[] = [
  {
    title: "Chilaquiles verdes horneados",
    minutes: 30,
    finde: true,
    slot: "desayuno",
    ingredients: ["Tortillas de maíz en triángulos", "Salsa verde casera", "Pechuga deshebrada", "Queso fresco", "Cebolla y crema ligera"],
    steps: ["Hornea los totopos 12 min a 200 °C, sin aceite.", "Calienta la salsa y baña los totopos.", "Sirve con pollo, queso fresco y cebolla."],
  },
  {
    title: "Hot cakes de avena y plátano",
    minutes: 20,
    finde: true,
    slot: "desayuno",
    ingredients: ["1 taza de avena", "2 plátanos", "2 huevos", "1/2 taza de leche", "Canela y fruta para servir"],
    steps: ["Licúa todo hasta que quede una mezcla espesa.", "Cocina en sartén antiadherente a fuego medio.", "Sirve con fruta picada y un poco de miel."],
  },
  {
    title: "Huevos rancheros ligeros",
    minutes: 20,
    finde: true,
    slot: "desayuno",
    ingredients: ["Huevos", "Tortillas de maíz", "Salsa roja de jitomate", "Frijoles de la olla", "Aguacate"],
    steps: ["Calienta las tortillas en comal.", "Cocina los huevos estrellados con poco aceite.", "Baña con salsa y acompaña con frijoles y aguacate."],
  },
  {
    title: "Pozole verde de pollo",
    minutes: 60,
    finde: true,
    slot: "comida",
    ingredients: ["Maíz pozolero cocido", "Pechuga y muslo de pollo", "Tomate verde, chile poblano y cilantro", "Pepitas", "Lechuga, rábano y orégano"],
    steps: ["Cuece el pollo con ajo y cebolla.", "Licúa tomate, poblano, cilantro y pepitas; sofríe la salsa.", "Junta caldo, maíz, pollo y salsa; hierve 20 min.", "Sirve con lechuga, rábano y orégano."],
  },
  {
    title: "Brochetas de pollo y verduras",
    minutes: 40,
    finde: true,
    slot: "comida",
    ingredients: ["Pechuga en cubos", "Pimiento, cebolla y calabacita", "Limón, ajo y pimentón", "Arroz o ensalada para acompañar"],
    steps: ["Marina el pollo 15 min con limón, ajo y pimentón.", "Arma las brochetas alternando con verduras.", "Asa a la plancha o al carbón 12–15 min."],
  },
  {
    title: "Ceviche de pescado",
    minutes: 30,
    finde: true,
    slot: "comida",
    ingredients: ["Filete de tilapia o sierra en cubitos", "Jugo de limón", "Jitomate, cebolla, pepino y cilantro", "Aguacate", "Tostadas horneadas"],
    steps: ["Cubre el pescado con limón y refrigera 20 min.", "Escurre y mezcla con las verduras picadas.", "Sirve sobre tostadas horneadas con aguacate."],
  },
  {
    title: "Fajitas de res con pimientos",
    minutes: 30,
    finde: true,
    slot: "cena",
    ingredients: ["Bistec de res en tiras", "Pimientos de colores", "Cebolla", "Tortillas de maíz", "Guacamole"],
    steps: ["Saltea la carne a fuego alto con poco aceite.", "Agrega pimientos y cebolla; cocina 5 min.", "Sirve en tortillas con guacamole."],
  },
  {
    title: "Calabacitas a la mexicana con pollo",
    minutes: 30,
    finde: false,
    slot: "comida",
    ingredients: ["Calabacitas", "Elote desgranado", "Jitomate, cebolla y chile", "Pechuga en cubos", "Queso panela"],
    steps: ["Dora el pollo en cubos.", "Agrega jitomate, cebolla y chile; luego calabacita y elote.", "Tapa 10 min y termina con queso panela."],
  },
  {
    title: "Tinga de pollo",
    minutes: 35,
    finde: false,
    slot: "comida",
    ingredients: ["Pechuga deshebrada", "Jitomate", "Cebolla fileteada", "Chipotle", "Tostadas horneadas y lechuga"],
    steps: ["Sofríe la cebolla hasta que se suavice.", "Licúa jitomate con chipotle y agrégalo.", "Incorpora el pollo y cocina 10 min."],
  },
  {
    title: "Caldo de pollo con verduras",
    minutes: 50,
    finde: false,
    slot: "comida",
    ingredients: ["Piezas de pollo sin piel", "Zanahoria, papa, calabacita y chayote", "Arroz", "Cilantro y limón"],
    steps: ["Cuece el pollo con ajo y cebolla 25 min.", "Agrega las verduras en trozos y el arroz.", "Cocina 15 min más y sirve con limón."],
  },
  {
    title: "Tacos de pescado a la plancha",
    minutes: 25,
    finde: false,
    slot: "cena",
    ingredients: ["Filete de pescado", "Col morada rallada", "Pico de gallo", "Limón", "Tortillas de maíz"],
    steps: ["Sazona el pescado con limón, ajo y pimienta.", "Cocínalo a la plancha 3 min por lado.", "Arma los tacos con col y pico de gallo."],
  },
  {
    title: "Enfrijoladas con queso fresco",
    minutes: 25,
    finde: false,
    slot: "cena",
    ingredients: ["Frijoles negros cocidos", "Tortillas de maíz", "Chile chipotle (opcional)", "Queso fresco", "Cebolla y aguacate"],
    steps: ["Licúa los frijoles con su caldo y un poco de chipotle.", "Pasa las tortillas calientes por la salsa y dóblalas.", "Sirve con queso, cebolla y aguacate."],
  },
  {
    title: "Sopa de lentejas con verduras",
    minutes: 40,
    finde: false,
    slot: "comida",
    ingredients: ["Lentejas", "Zanahoria", "Jitomate y cebolla", "Plátano macho (opcional)", "Cilantro"],
    steps: ["Cuece las lentejas 20 min.", "Agrega jitomate licuado y zanahoria en cubos.", "Cocina 15 min más; sirve con cilantro."],
  },
  {
    title: "Albóndigas de pavo en caldillo",
    minutes: 45,
    finde: false,
    slot: "comida",
    ingredients: ["Carne molida de pavo", "Huevo y avena", "Jitomate y chipotle", "Calabacita y zanahoria", "Hierbabuena"],
    steps: ["Mezcla pavo, huevo, avena y hierbabuena; forma bolitas.", "Prepara un caldillo de jitomate con chipotle.", "Cuece las albóndigas y verduras en el caldillo 25 min."],
  },
  {
    title: "Bowl de arroz, frijoles y pollo",
    minutes: 25,
    finde: false,
    slot: "comida",
    ingredients: ["Arroz (de preferencia integral)", "Frijoles", "Pollo a la plancha", "Pico de gallo", "Aguacate y elote"],
    steps: ["Cocina el arroz y calienta los frijoles.", "Asa el pollo y córtalo en tiras.", "Arma el bowl con todo y pico de gallo encima."],
  },
  {
    title: "Tostadas de atún con aguacate",
    minutes: 15,
    finde: false,
    slot: "cena",
    ingredients: ["Atún en agua", "Jitomate, cebolla y cilantro", "Limón", "Aguacate", "Tostadas horneadas"],
    steps: ["Escurre el atún y mézclalo con la verdura picada y limón.", "Sirve sobre tostadas con rebanadas de aguacate."],
  },
];

/** Unas cuantas recetas que cambian cada día para no ver siempre las mismas. */
export function recetasDelDia(day: string, finde: boolean, n: number): Receta[] {
  const list = RECETAS.filter((r) => r.finde === finde);
  const seed = Number(day.replaceAll("-", "")) % list.length;
  return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(seed + i) % list.length]);
}
