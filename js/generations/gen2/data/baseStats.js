/**
 * Gen 2 Base Stats and Catch Rates
 *
 * Contains base stat data for all 251 Pokemon (Gold/Silver/Crystal).
 *
 * Base stats use the Gen 1/2 format with a single Special stat (spc),
 * which applies to both Special Attack and Special Defense in battle.
 * Gen 2 internally splits Special into SpAtk/SpDef for damage calculation,
 * but the base stat value is shared between them.
 *
 * Catch rates are the raw values (0-255) stored in the game data,
 * used in the catch formula. These are the Gen 2 values which may
 * differ from later generations.
 *
 * @module generations/gen2/data/baseStats
 */

/**
 * Gen 2 Pokemon base stats, indexed by National Dex ID.
 * Index 0 is null. Each entry has: { hp, atk, def, spe, spc }
 * - hp:  HP base stat
 * - atk:  Attack base stat
 * - def:  Defense base stat
 * - spe:  Speed base stat
 * - spc:  Special base stat (shared for SpAtk and SpDef in Gen 2)
 *
 * @type {Array<{hp:number,atk:number,def:number,spe:number,spc:number}|null>}
 */
export const GEN2_BASE_STATS = [
  null,
  // 001-010
  { hp: 45, atk: 49, def: 49, spe: 45, spc: 65 },   // 001 Bulbasaur
  { hp: 60, atk: 62, def: 63, spe: 60, spc: 80 },   // 002 Ivysaur
  { hp: 80, atk: 82, def: 83, spe: 80, spc: 100 },  // 003 Venusaur
  { hp: 39, atk: 52, def: 43, spe: 65, spc: 60 },   // 004 Charmander
  { hp: 58, atk: 64, def: 58, spe: 80, spc: 65 },   // 005 Charmeleon
  { hp: 78, atk: 84, def: 78, spe: 100, spc: 85 },  // 006 Charizard
  { hp: 44, atk: 48, def: 65, spe: 43, spc: 50 },   // 007 Squirtle
  { hp: 59, atk: 63, def: 80, spe: 58, spc: 65 },   // 008 Wartortle
  { hp: 79, atk: 83, def: 100, spe: 78, spc: 85 },  // 009 Blastoise
  { hp: 45, atk: 30, def: 35, spe: 45, spc: 20 },   // 010 Caterpie
  // 011-020
  { hp: 50, atk: 20, def: 55, spe: 30, spc: 25 },   // 011 Metapod
  { hp: 60, atk: 45, def: 50, spe: 70, spc: 80 },   // 012 Butterfree
  { hp: 40, atk: 35, def: 30, spe: 50, spc: 20 },   // 013 Weedle
  { hp: 45, atk: 25, def: 50, spe: 35, spc: 25 },   // 014 Kakuna
  { hp: 65, atk: 80, def: 40, spe: 75, spc: 45 },   // 015 Beedrill
  { hp: 40, atk: 45, def: 40, spe: 56, spc: 35 },   // 016 Pidgey
  { hp: 63, atk: 60, def: 55, spe: 71, spc: 50 },   // 017 Pidgeotto
  { hp: 83, atk: 80, def: 75, spe: 91, spc: 70 },   // 018 Pidgeot
  { hp: 30, atk: 56, def: 35, spe: 72, spc: 25 },   // 019 Rattata
  { hp: 55, atk: 81, def: 60, spe: 97, spc: 50 },   // 020 Raticate
  // 021-030
  { hp: 40, atk: 60, def: 30, spe: 70, spc: 31 },   // 021 Spearow
  { hp: 65, atk: 90, def: 65, spe: 100, spc: 61 },  // 022 Fearow
  { hp: 35, atk: 60, def: 44, spe: 55, spc: 40 },   // 023 Ekans
  { hp: 60, atk: 85, def: 69, spe: 80, spc: 65 },   // 024 Arbok
  { hp: 35, atk: 55, def: 30, spe: 90, spc: 50 },   // 025 Pikachu
  { hp: 60, atk: 90, def: 55, spe: 100, spc: 90 },  // 026 Raichu
  { hp: 50, atk: 75, def: 85, spe: 40, spc: 30 },   // 027 Sandshrew
  { hp: 75, atk: 100, def: 110, spe: 65, spc: 55 }, // 028 Sandslash
  { hp: 55, atk: 47, def: 52, spe: 41, spc: 40 },   // 029 Nidoran F
  { hp: 70, atk: 62, def: 67, spe: 56, spc: 55 },   // 030 Nidorina
  // 031-040
  { hp: 90, atk: 82, def: 87, spe: 76, spc: 75 },   // 031 Nidoqueen
  { hp: 46, atk: 57, def: 40, spe: 50, spc: 40 },   // 032 Nidoran M
  { hp: 61, atk: 72, def: 57, spe: 65, spc: 55 },   // 033 Nidorino
  { hp: 81, atk: 92, def: 77, spe: 85, spc: 75 },   // 034 Nidoking
  { hp: 70, atk: 45, def: 48, spe: 35, spc: 60 },   // 035 Clefairy
  { hp: 95, atk: 70, def: 73, spe: 60, spc: 85 },   // 036 Clefable
  { hp: 38, atk: 41, def: 40, spe: 65, spc: 50 },   // 037 Vulpix
  { hp: 73, atk: 76, def: 75, spe: 100, spc: 81 },  // 038 Ninetales
  { hp: 115, atk: 45, def: 20, spe: 20, spc: 25 },  // 039 Jigglypuff
  { hp: 140, atk: 70, def: 45, spe: 45, spc: 50 },  // 040 Wigglytuff
  // 041-050
  { hp: 40, atk: 45, def: 35, spe: 55, spc: 40 },   // 041 Zubat
  { hp: 75, atk: 80, def: 70, spe: 90, spc: 75 },   // 042 Golbat
  { hp: 45, atk: 50, def: 55, spe: 30, spc: 75 },   // 043 Oddish
  { hp: 60, atk: 65, def: 70, spe: 40, spc: 85 },   // 044 Gloom
  { hp: 75, atk: 80, def: 85, spe: 50, spc: 100 },  // 045 Vileplume
  { hp: 35, atk: 70, def: 55, spe: 25, spc: 55 },   // 046 Paras
  { hp: 60, atk: 95, def: 80, spe: 30, spc: 80 },   // 047 Parasect
  { hp: 60, atk: 55, def: 50, spe: 45, spc: 40 },   // 048 Venonat
  { hp: 70, atk: 65, def: 60, spe: 90, spc: 90 },   // 049 Venomoth
  { hp: 10, atk: 55, def: 25, spe: 95, spc: 45 },   // 050 Diglett
  // 051-060
  { hp: 35, atk: 80, def: 50, spe: 120, spc: 70 },  // 051 Dugtrio
  { hp: 40, atk: 45, def: 35, spe: 90, spc: 40 },   // 052 Meowth
  { hp: 65, atk: 70, def: 60, spe: 115, spc: 65 },  // 053 Persian
  { hp: 50, atk: 52, def: 48, spe: 55, spc: 50 },   // 054 Psyduck
  { hp: 80, atk: 82, def: 78, spe: 85, spc: 95 },   // 055 Golduck
  { hp: 40, atk: 80, def: 35, spe: 70, spc: 35 },   // 056 Mankey
  { hp: 65, atk: 105, def: 60, spe: 95, spc: 60 },  // 057 Primeape
  { hp: 55, atk: 70, def: 45, spe: 60, spc: 50 },   // 058 Growlithe
  { hp: 90, atk: 110, def: 80, spe: 95, spc: 80 },  // 059 Arcanine
  { hp: 40, atk: 50, def: 40, spe: 90, spc: 40 },   // 060 Poliwag
  // 061-070
  { hp: 65, atk: 65, def: 65, spe: 90, spc: 50 },   // 061 Poliwhirl
  { hp: 90, atk: 85, def: 95, spe: 70, spc: 70 },   // 062 Poliwrath
  { hp: 25, atk: 20, def: 15, spe: 90, spc: 105 },  // 063 Abra
  { hp: 40, atk: 35, def: 30, spe: 105, spc: 120 }, // 064 Kadabra
  { hp: 55, atk: 50, def: 45, spe: 120, spc: 135 }, // 065 Alakazam
  { hp: 70, atk: 80, def: 50, spe: 35, spc: 35 },   // 066 Machop
  { hp: 80, atk: 100, def: 70, spe: 45, spc: 50 },  // 067 Machoke
  { hp: 90, atk: 130, def: 80, spe: 55, spc: 65 },  // 068 Machamp
  { hp: 50, atk: 75, def: 35, spe: 40, spc: 70 },   // 069 Bellsprout
  { hp: 65, atk: 90, def: 50, spe: 55, spc: 85 },   // 070 Weepinbell
  // 071-080
  { hp: 80, atk: 105, def: 65, spe: 70, spc: 100 }, // 071 Victreebel
  { hp: 40, atk: 40, def: 35, spe: 70, spc: 50 },   // 072 Tentacool
  { hp: 80, atk: 70, def: 65, spe: 100, spc: 80 },  // 073 Tentacruel
  { hp: 40, atk: 80, def: 100, spe: 20, spc: 30 },  // 074 Geodude
  { hp: 55, atk: 95, def: 115, spe: 35, spc: 45 },  // 075 Graveler
  { hp: 80, atk: 110, def: 130, spe: 45, spc: 55 }, // 076 Golem
  { hp: 50, atk: 85, def: 55, spe: 90, spc: 65 },   // 077 Ponyta
  { hp: 65, atk: 100, def: 70, spe: 105, spc: 80 }, // 078 Rapidash
  { hp: 90, atk: 65, def: 65, spe: 15, spc: 40 },   // 079 Slowpoke
  { hp: 95, atk: 75, def: 110, spe: 30, spc: 80 },  // 080 Slowbro
  // 081-090
  { hp: 25, atk: 35, def: 70, spe: 45, spc: 95 },   // 081 Magnemite
  { hp: 50, atk: 60, def: 95, spe: 70, spc: 120 },  // 082 Magneton
  { hp: 52, atk: 65, def: 55, spe: 60, spc: 58 },   // 083 Farfetchd
  { hp: 35, atk: 85, def: 45, spe: 75, spc: 35 },   // 084 Doduo
  { hp: 60, atk: 110, def: 70, spe: 100, spc: 60 }, // 085 Dodrio
  { hp: 65, atk: 45, def: 55, spe: 45, spc: 70 },   // 086 Seel
  { hp: 90, atk: 70, def: 80, spe: 70, spc: 95 },   // 087 Dewgong
  { hp: 80, atk: 80, def: 50, spe: 25, spc: 40 },   // 088 Grimer
  { hp: 105, atk: 105, def: 75, spe: 50, spc: 65 }, // 089 Muk
  { hp: 30, atk: 65, def: 100, spe: 40, spc: 45 },  // 090 Shellder
  // 091-100
  { hp: 50, atk: 95, def: 180, spe: 70, spc: 85 },  // 091 Cloyster
  { hp: 30, atk: 35, def: 30, spe: 80, spc: 100 },  // 092 Gastly
  { hp: 45, atk: 50, def: 45, spe: 95, spc: 115 },  // 093 Haunter
  { hp: 60, atk: 65, def: 60, spe: 110, spc: 130 }, // 094 Gengar
  { hp: 35, atk: 45, def: 160, spe: 70, spc: 30 },  // 095 Onix
  { hp: 60, atk: 48, def: 45, spe: 42, spc: 90 },   // 096 Drowzee
  { hp: 85, atk: 73, def: 70, spe: 67, spc: 115 },  // 097 Hypno
  { hp: 30, atk: 105, def: 90, spe: 50, spc: 25 },  // 098 Krabby
  { hp: 55, atk: 130, def: 115, spe: 75, spc: 50 }, // 099 Kingler
  { hp: 40, atk: 30, def: 50, spe: 100, spc: 55 },  // 100 Voltorb
  // 101-110
  { hp: 60, atk: 50, def: 70, spe: 140, spc: 80 },  // 101 Electrode
  { hp: 60, atk: 40, def: 80, spe: 40, spc: 60 },   // 102 Exeggcute
  { hp: 95, atk: 95, def: 85, spe: 55, spc: 125 },  // 103 Exeggutor
  { hp: 50, atk: 50, def: 95, spe: 35, spc: 40 },   // 104 Cubone
  { hp: 60, atk: 80, def: 110, spe: 45, spc: 50 },  // 105 Marowak
  { hp: 50, atk: 120, def: 53, spe: 87, spc: 35 },  // 106 Hitmonlee
  { hp: 50, atk: 105, def: 79, spe: 76, spc: 35 },  // 107 Hitmonchan
  { hp: 90, atk: 55, def: 75, spe: 30, spc: 60 },   // 108 Lickitung
  { hp: 40, atk: 65, def: 95, spe: 35, spc: 60 },   // 109 Koffing
  { hp: 65, atk: 90, def: 120, spe: 60, spc: 85 },  // 110 Weezing
  // 111-120
  { hp: 80, atk: 85, def: 95, spe: 25, spc: 30 },   // 111 Rhyhorn
  { hp: 105, atk: 130, def: 120, spe: 40, spc: 45 }, // 112 Rhydon
  { hp: 250, atk: 5, def: 5, spe: 50, spc: 105 },   // 113 Chansey
  { hp: 65, atk: 55, def: 115, spe: 60, spc: 100 }, // 114 Tangela
  { hp: 105, atk: 95, def: 80, spe: 90, spc: 40 },  // 115 Kangaskhan
  { hp: 30, atk: 40, def: 70, spe: 60, spc: 70 },   // 116 Horsea
  { hp: 55, atk: 65, def: 95, spe: 85, spc: 95 },   // 117 Seadra
  { hp: 45, atk: 67, def: 60, spe: 63, spc: 50 },   // 118 Goldeen
  { hp: 80, atk: 92, def: 65, spe: 68, spc: 80 },   // 119 Seaking
  { hp: 30, atk: 45, def: 55, spe: 85, spc: 70 },   // 120 Staryu
  // 121-130
  { hp: 60, atk: 75, def: 85, spe: 115, spc: 100 }, // 121 Starmie
  { hp: 40, atk: 45, def: 65, spe: 90, spc: 100 },  // 122 Mr. Mime
  { hp: 70, atk: 110, def: 80, spe: 105, spc: 55 }, // 123 Scyther
  { hp: 65, atk: 50, def: 35, spe: 95, spc: 95 },   // 124 Jynx
  { hp: 65, atk: 83, def: 57, spe: 105, spc: 85 },  // 125 Electabuzz
  { hp: 65, atk: 95, def: 57, spe: 93, spc: 85 },   // 126 Magmar
  { hp: 65, atk: 125, def: 100, spe: 85, spc: 55 }, // 127 Pinsir
  { hp: 75, atk: 100, def: 95, spe: 110, spc: 70 }, // 128 Tauros
  { hp: 20, atk: 10, def: 55, spe: 80, spc: 20 },   // 129 Magikarp
  { hp: 95, atk: 125, def: 79, spe: 81, spc: 100 }, // 130 Gyarados
  // 131-140
  { hp: 130, atk: 85, def: 80, spe: 60, spc: 95 },  // 131 Lapras
  { hp: 48, atk: 48, def: 48, spe: 48, spc: 48 },   // 132 Ditto
  { hp: 55, atk: 55, def: 50, spe: 55, spc: 45 },   // 133 Eevee
  { hp: 130, atk: 65, def: 60, spe: 65, spc: 110 }, // 134 Vaporeon
  { hp: 65, atk: 65, def: 60, spe: 130, spc: 110 }, // 135 Jolteon
  { hp: 65, atk: 130, def: 60, spe: 65, spc: 110 }, // 136 Flareon
  { hp: 65, atk: 60, def: 70, spe: 40, spc: 75 },   // 137 Porygon
  { hp: 35, atk: 40, def: 100, spe: 35, spc: 90 },  // 138 Omanyte
  { hp: 70, atk: 60, def: 125, spe: 55, spc: 115 }, // 139 Omastar
  { hp: 30, atk: 80, def: 90, spe: 55, spc: 45 },   // 140 Kabuto
  // 141-150
  { hp: 60, atk: 115, def: 105, spe: 80, spc: 70 }, // 141 Kabutops
  { hp: 80, atk: 105, def: 65, spe: 130, spc: 60 }, // 142 Aerodactyl
  { hp: 160, atk: 110, def: 65, spe: 30, spc: 65 }, // 143 Snorlax
  { hp: 90, atk: 85, def: 100, spe: 85, spc: 125 }, // 144 Articuno
  { hp: 90, atk: 90, def: 85, spe: 100, spc: 125 }, // 145 Zapdos
  { hp: 90, atk: 100, def: 90, spe: 90, spc: 125 }, // 146 Moltres
  { hp: 41, atk: 64, def: 45, spe: 50, spc: 50 },   // 147 Dratini
  { hp: 61, atk: 84, def: 65, spe: 70, spc: 70 },   // 148 Dragonair
  { hp: 91, atk: 134, def: 95, spe: 80, spc: 100 }, // 149 Dragonite
  { hp: 106, atk: 110, def: 90, spe: 130, spc: 154 }, // 150 Mewtwo
  // 151-160
  { hp: 100, atk: 100, def: 100, spe: 100, spc: 100 }, // 151 Mew
  { hp: 45, atk: 49, def: 65, spe: 45, spc: 65 },   // 152 Chikorita
  { hp: 60, atk: 62, def: 80, spe: 60, spc: 80 },   // 153 Bayleef
  { hp: 80, atk: 82, def: 100, spe: 80, spc: 100 }, // 154 Meganium
  { hp: 39, atk: 52, def: 43, spe: 65, spc: 60 },   // 155 Cyndaquil
  { hp: 58, atk: 64, def: 58, spe: 80, spc: 65 },   // 156 Quilava
  { hp: 78, atk: 84, def: 78, spe: 100, spc: 85 },  // 157 Typhlosion
  { hp: 50, atk: 65, def: 64, spe: 43, spc: 44 },   // 158 Totodile
  { hp: 65, atk: 80, def: 80, spe: 58, spc: 59 },   // 159 Croconaw
  { hp: 85, atk: 105, def: 100, spe: 78, spc: 79 }, // 160 Feraligatr
  // 161-170
  { hp: 35, atk: 46, def: 34, spe: 20, spc: 35 },   // 161 Sentret
  { hp: 85, atk: 76, def: 64, spe: 90, spc: 45 },   // 162 Furret
  { hp: 60, atk: 30, def: 30, spe: 50, spc: 36 },   // 163 Hoothoot
  { hp: 100, atk: 50, def: 50, spe: 70, spc: 76 },  // 164 Noctowl
  { hp: 40, atk: 20, def: 30, spe: 55, spc: 40 },   // 165 Ledyba
  { hp: 55, atk: 35, def: 50, spe: 85, spc: 55 },   // 166 Ledian
  { hp: 40, atk: 60, def: 40, spe: 30, spc: 40 },   // 167 Spinarak
  { hp: 70, atk: 90, def: 70, spe: 40, spc: 60 },   // 168 Ariados
  { hp: 85, atk: 90, def: 80, spe: 130, spc: 80 },  // 169 Crobat
  { hp: 75, atk: 38, def: 38, spe: 67, spc: 56 },   // 170 Chinchou
  // 171-180
  { hp: 125, atk: 58, def: 58, spe: 67, spc: 76 },  // 171 Lanturn
  { hp: 20, atk: 40, def: 15, spe: 60, spc: 35 },   // 172 Pichu
  { hp: 50, atk: 25, def: 28, spe: 15, spc: 45 },   // 173 Cleffa
  { hp: 90, atk: 30, def: 15, spe: 15, spc: 40 },   // 174 Igglybuff
  { hp: 35, atk: 20, def: 65, spe: 20, spc: 40 },   // 175 Togepi
  { hp: 55, atk: 40, def: 85, spe: 40, spc: 80 },   // 176 Togetic
  { hp: 40, atk: 50, def: 45, spe: 70, spc: 70 },   // 177 Natu
  { hp: 65, atk: 75, def: 70, spe: 95, spc: 95 },   // 178 Xatu
  { hp: 55, atk: 40, def: 40, spe: 35, spc: 65 },   // 179 Mareep
  { hp: 70, atk: 55, def: 55, spe: 45, spc: 80 },   // 180 Flaaffy
  // 181-190
  { hp: 90, atk: 75, def: 75, spe: 55, spc: 115 },  // 181 Ampharos
  { hp: 75, atk: 80, def: 85, spe: 50, spc: 90 },   // 182 Bellossom
  { hp: 70, atk: 20, def: 50, spe: 40, spc: 20 },   // 183 Marill
  { hp: 100, atk: 50, def: 80, spe: 50, spc: 50 },  // 184 Azumarill
  { hp: 70, atk: 100, def: 115, spe: 30, spc: 30 }, // 185 Sudowoodo
  { hp: 90, atk: 75, def: 75, spe: 70, spc: 90 },   // 186 Politoed
  { hp: 35, atk: 35, def: 40, spe: 50, spc: 35 },   // 187 Hoppip
  { hp: 55, atk: 45, def: 50, spe: 80, spc: 45 },   // 188 Skiploom
  { hp: 75, atk: 55, def: 70, spe: 110, spc: 55 },  // 189 Jumpluff
  { hp: 55, atk: 70, def: 55, spe: 85, spc: 40 },   // 190 Aipom
  // 191-200
  { hp: 30, atk: 30, def: 30, spe: 30, spc: 30 },   // 191 Sunkern
  { hp: 75, atk: 75, def: 55, spe: 30, spc: 105 },  // 192 Sunflora
  { hp: 65, atk: 65, def: 45, spe: 95, spc: 75 },   // 193 Yanma
  { hp: 55, atk: 45, def: 45, spe: 15, spc: 25 },   // 194 Wooper
  { hp: 95, atk: 85, def: 85, spe: 35, spc: 65 },   // 195 Quagsire
  { hp: 65, atk: 65, def: 60, spe: 130, spc: 110 }, // 196 Espeon
  { hp: 95, atk: 65, def: 110, spe: 65, spc: 60 },  // 197 Umbreon
  { hp: 60, atk: 85, def: 42, spe: 91, spc: 85 },   // 198 Murkrow
  { hp: 95, atk: 75, def: 80, spe: 30, spc: 110 },  // 199 Slowking
  { hp: 60, atk: 60, def: 60, spe: 85, spc: 85 },   // 200 Misdreavus
  // 201-210
  { hp: 48, atk: 72, def: 48, spe: 48, spc: 48 },   // 201 Unown
  { hp: 190, atk: 33, def: 58, spe: 33, spc: 58 },  // 202 Wobbuffet
  { hp: 70, atk: 80, def: 65, spe: 85, spc: 90 },   // 203 Girafarig
  { hp: 50, atk: 65, def: 90, spe: 15, spc: 35 },   // 204 Pineco
  { hp: 75, atk: 90, def: 140, spe: 40, spc: 60 },  // 205 Forretress
  { hp: 100, atk: 70, def: 70, spe: 65, spc: 65 },  // 206 Dunsparce
  { hp: 65, atk: 75, def: 105, spe: 85, spc: 35 },  // 207 Gligar
  { hp: 75, atk: 85, def: 200, spe: 30, spc: 55 },  // 208 Steelix
  { hp: 60, atk: 80, def: 50, spe: 30, spc: 40 },   // 209 Snubbull
  { hp: 90, atk: 120, def: 75, spe: 45, spc: 60 },  // 210 Granbull
  // 211-220
  { hp: 65, atk: 95, def: 75, spe: 85, spc: 55 },   // 211 Qwilfish
  { hp: 70, atk: 130, def: 100, spe: 65, spc: 55 }, // 212 Scizor
  { hp: 20, atk: 10, def: 230, spe: 5, spc: 10 },   // 213 Shuckle
  { hp: 80, atk: 125, def: 75, spe: 85, spc: 40 },  // 214 Heracross
  { hp: 55, atk: 95, def: 55, spe: 115, spc: 35 },  // 215 Sneasel
  { hp: 60, atk: 80, def: 50, spe: 40, spc: 50 },   // 216 Teddiursa
  { hp: 90, atk: 130, def: 75, spe: 55, spc: 75 },  // 217 Ursaring
  { hp: 40, atk: 40, def: 40, spe: 20, spc: 70 },   // 218 Slugma
  { hp: 50, atk: 50, def: 120, spe: 30, spc: 80 },  // 219 Magcargo
  { hp: 50, atk: 50, def: 40, spe: 50, spc: 30 },   // 220 Swinub
  // 221-230
  { hp: 100, atk: 100, def: 80, spe: 50, spc: 60 }, // 221 Piloswine
  { hp: 55, atk: 55, def: 85, spe: 35, spc: 65 },   // 222 Corsola
  { hp: 35, atk: 65, def: 35, spe: 65, spc: 65 },   // 223 Remoraid
  { hp: 75, atk: 105, def: 75, spe: 45, spc: 105 }, // 224 Octillery
  { hp: 45, atk: 55, def: 45, spe: 75, spc: 65 },   // 225 Delibird
  { hp: 65, atk: 40, def: 70, spe: 70, spc: 80 },   // 226 Mantine
  { hp: 65, atk: 80, def: 140, spe: 70, spc: 40 },  // 227 Skarmory
  { hp: 45, atk: 60, def: 30, spe: 65, spc: 80 },   // 228 Houndour
  { hp: 75, atk: 90, def: 50, spe: 95, spc: 110 },  // 229 Houndoom
  { hp: 75, atk: 95, def: 95, spe: 85, spc: 95 },   // 230 Kingdra
  // 231-240
  { hp: 90, atk: 60, def: 60, spe: 40, spc: 40 },   // 231 Phanpy
  { hp: 90, atk: 120, def: 120, spe: 50, spc: 60 }, // 232 Donphan
  { hp: 85, atk: 80, def: 90, spe: 60, spc: 105 },  // 233 Porygon2
  { hp: 73, atk: 95, def: 62, spe: 85, spc: 85 },   // 234 Stantler
  { hp: 55, atk: 20, def: 35, spe: 75, spc: 20 },   // 235 Smeargle
  { hp: 35, atk: 35, def: 35, spe: 35, spc: 35 },   // 236 Tyrogue
  { hp: 50, atk: 95, def: 95, spe: 70, spc: 35 },   // 237 Hitmontop
  { hp: 45, atk: 30, def: 15, spe: 65, spc: 85 },   // 238 Smoochum
  { hp: 45, atk: 63, def: 37, spe: 65, spc: 55 },   // 239 Elekid
  { hp: 45, atk: 75, def: 37, spe: 83, spc: 70 },   // 240 Magby
  // 241-251
  { hp: 95, atk: 80, def: 105, spe: 100, spc: 40 }, // 241 Miltank
  { hp: 255, atk: 10, def: 10, spe: 55, spc: 135 }, // 242 Blissey
  { hp: 90, atk: 85, def: 75, spe: 115, spc: 115 }, // 243 Raikou
  { hp: 115, atk: 115, def: 85, spe: 100, spc: 90 }, // 244 Entei
  { hp: 100, atk: 75, def: 115, spe: 85, spc: 115 }, // 245 Suicune
  { hp: 50, atk: 64, def: 50, spe: 41, spc: 45 },   // 246 Larvitar
  { hp: 70, atk: 84, def: 70, spe: 51, spc: 55 },   // 247 Pupitar
  { hp: 100, atk: 134, def: 110, spe: 61, spc: 95 }, // 248 Tyranitar
  { hp: 106, atk: 90, def: 130, spe: 110, spc: 154 }, // 249 Lugia
  { hp: 106, atk: 130, def: 90, spe: 90, spc: 154 }, // 250 Ho-Oh
  { hp: 100, atk: 100, def: 100, spe: 100, spc: 100 }, // 251 Celebi
];

/**
 * Gen 2 Pokemon catch rates, indexed by National Dex ID.
 * Index 0 is null. Values range from 0-255 (higher = easier to catch).
 * These are the Gen 2 specific catch rate values.
 *
 * @type {Array<number|null>}
 */
export const GEN2_CATCH_RATES = [
  null,
  // 001-010
  45,   // 001 Bulbasaur
  45,   // 002 Ivysaur
  45,   // 003 Venusaur
  45,   // 004 Charmander
  45,   // 005 Charmeleon
  45,   // 006 Charizard
  45,   // 007 Squirtle
  45,   // 008 Wartortle
  45,   // 009 Blastoise
  255,  // 010 Caterpie
  // 011-020
  120,  // 011 Metapod
  45,   // 012 Butterfree
  255,  // 013 Weedle
  120,  // 014 Kakuna
  45,   // 015 Beedrill
  255,  // 016 Pidgey
  120,  // 017 Pidgeotto
  45,   // 018 Pidgeot
  255,  // 019 Rattata
  127,  // 020 Raticate
  // 021-030
  255,  // 021 Spearow
  90,   // 022 Fearow
  255,  // 023 Ekans
  90,   // 024 Arbok
  190,  // 025 Pikachu
  75,   // 026 Raichu
  255,  // 027 Sandshrew
  90,   // 028 Sandslash
  235,  // 029 Nidoran F
  120,  // 030 Nidorina
  // 031-040
  45,   // 031 Nidoqueen
  235,  // 032 Nidoran M
  120,  // 033 Nidorino
  45,   // 034 Nidoking
  150,  // 035 Clefairy
  25,   // 036 Clefable
  190,  // 037 Vulpix
  75,   // 038 Ninetales
  170,  // 039 Jigglypuff
  50,   // 040 Wigglytuff
  // 041-050
  255,  // 041 Zubat
  90,   // 042 Golbat
  255,  // 043 Oddish
  120,  // 044 Gloom
  45,   // 045 Vileplume
  190,  // 046 Paras
  75,   // 047 Parasect
  190,  // 048 Venonat
  75,   // 049 Venomoth
  255,  // 050 Diglett
  // 051-060
  50,   // 051 Dugtrio
  255,  // 052 Meowth
  90,   // 053 Persian
  190,  // 054 Psyduck
  75,   // 055 Golduck
  190,  // 056 Mankey
  75,   // 057 Primeape
  190,  // 058 Growlithe
  75,   // 059 Arcanine
  255,  // 060 Poliwag
  // 061-070
  120,  // 061 Poliwhirl
  45,   // 062 Poliwrath
  200,  // 063 Abra
  100,  // 064 Kadabra
  50,   // 065 Alakazam
  180,  // 066 Machop
  90,   // 067 Machoke
  45,   // 068 Machamp
  255,  // 069 Bellsprout
  120,  // 070 Weepinbell
  // 071-080
  45,   // 071 Victreebel
  190,  // 072 Tentacool
  60,   // 073 Tentacruel
  255,  // 074 Geodude
  120,  // 075 Graveler
  45,   // 076 Golem
  190,  // 077 Ponyta
  60,   // 078 Rapidash
  190,  // 079 Slowpoke
  75,   // 080 Slowbro
  // 081-090
  190,  // 081 Magnemite
  60,   // 082 Magneton
  45,   // 083 Farfetchd
  190,  // 084 Doduo
  45,   // 085 Dodrio
  190,  // 086 Seel
  75,   // 087 Dewgong
  190,  // 088 Grimer
  75,   // 089 Muk
  190,  // 090 Shellder
  // 091-100
  60,   // 091 Cloyster
  190,  // 092 Gastly
  90,   // 093 Haunter
  45,   // 094 Gengar
  45,   // 095 Onix
  190,  // 096 Drowzee
  75,   // 097 Hypno
  225,  // 098 Krabby
  60,   // 099 Kingler
  190,  // 100 Voltorb
  // 101-110
  60,   // 101 Electrode
  90,   // 102 Exeggcute
  45,   // 103 Exeggutor
  190,  // 104 Cubone
  75,   // 105 Marowak
  45,   // 106 Hitmonlee
  45,   // 107 Hitmonchan
  45,   // 108 Lickitung
  190,  // 109 Koffing
  60,   // 110 Weezing
  // 111-120
  120,  // 111 Rhyhorn
  30,   // 112 Rhydon
  30,   // 113 Chansey
  45,   // 114 Tangela
  45,   // 115 Kangaskhan
  225,  // 116 Horsea
  75,   // 117 Seadra
  225,  // 118 Goldeen
  60,   // 119 Seaking
  225,  // 120 Staryu
  // 121-130
  60,   // 121 Starmie
  45,   // 122 Mr. Mime
  45,   // 123 Scyther
  45,   // 124 Jynx
  45,   // 125 Electabuzz
  45,   // 126 Magmar
  45,   // 127 Pinsir
  45,   // 128 Tauros
  255,  // 129 Magikarp
  45,   // 130 Gyarados
  // 131-140
  45,   // 131 Lapras
  35,   // 132 Ditto
  45,   // 133 Eevee
  45,   // 134 Vaporeon
  45,   // 135 Jolteon
  45,   // 136 Flareon
  45,   // 137 Porygon
  45,   // 138 Omanyte
  45,   // 139 Omastar
  45,   // 140 Kabuto
  // 141-150
  45,   // 141 Kabutops
  45,   // 142 Aerodactyl
  25,   // 143 Snorlax
  3,    // 144 Articuno
  3,    // 145 Zapdos
  3,    // 146 Moltres
  45,   // 147 Dratini
  45,   // 148 Dragonair
  45,   // 149 Dragonite
  3,    // 150 Mewtwo
  // 151-160
  45,   // 151 Mew
  45,   // 152 Chikorita
  45,   // 153 Bayleef
  45,   // 154 Meganium
  45,   // 155 Cyndaquil
  45,   // 156 Quilava
  45,   // 157 Typhlosion
  45,   // 158 Totodile
  45,   // 159 Croconaw
  45,   // 160 Feraligatr
  // 161-170
  255,  // 161 Sentret
  90,   // 162 Furret
  255,  // 163 Hoothoot
  90,   // 164 Noctowl
  255,  // 165 Ledyba
  90,   // 166 Ledian
  255,  // 167 Spinarak
  90,   // 168 Ariados
  90,   // 169 Crobat
  190,  // 170 Chinchou
  // 171-180
  75,   // 171 Lanturn
  190,  // 172 Pichu
  150,  // 173 Cleffa
  170,  // 174 Igglybuff
  190,  // 175 Togepi
  75,   // 176 Togetic
  190,  // 177 Natu
  75,   // 178 Xatu
  235,  // 179 Mareep
  120,  // 180 Flaaffy
  // 181-190
  45,   // 181 Ampharos
  45,   // 182 Bellossom
  190,  // 183 Marill
  75,   // 184 Azumarill
  65,   // 185 Sudowoodo
  45,   // 186 Politoed
  255,  // 187 Hoppip
  120,  // 188 Skiploom
  45,   // 189 Jumpluff
  45,   // 190 Aipom
  // 191-200
  235,  // 191 Sunkern
  120,  // 192 Sunflora
  75,   // 193 Yanma
  255,  // 194 Wooper
  90,   // 195 Quagsire
  45,   // 196 Espeon
  45,   // 197 Umbreon
  30,   // 198 Murkrow
  70,   // 199 Slowking
  45,   // 200 Misdreavus
  // 201-210
  225,  // 201 Unown
  45,   // 202 Wobbuffet
  60,   // 203 Girafarig
  190,  // 204 Pineco
  75,   // 205 Forretress
  190,  // 206 Dunsparce
  60,   // 207 Gligar
  25,   // 208 Steelix
  190,  // 209 Snubbull
  75,   // 210 Granbull
  // 211-220
  45,   // 211 Qwilfish
  25,   // 212 Scizor
  190,  // 213 Shuckle
  45,   // 214 Heracross
  60,   // 215 Sneasel
  120,  // 216 Teddiursa
  60,   // 217 Ursaring
  190,  // 218 Slugma
  75,   // 219 Magcargo
  225,  // 220 Swinub
  // 221-230
  75,   // 221 Piloswine
  60,   // 222 Corsola
  190,  // 223 Remoraid
  75,   // 224 Octillery
  45,   // 225 Delibird
  25,   // 226 Mantine
  25,   // 227 Skarmory
  120,  // 228 Houndour
  45,   // 229 Houndoom
  45,   // 230 Kingdra
  // 231-240
  120,  // 231 Phanpy
  60,   // 232 Donphan
  45,   // 233 Porygon2
  45,   // 234 Stantler
  45,   // 235 Smeargle
  75,   // 236 Tyrogue
  45,   // 237 Hitmontop
  45,   // 238 Smoochum
  45,   // 239 Elekid
  45,   // 240 Magby
  // 241-251
  45,   // 241 Miltank
  30,   // 242 Blissey
  3,    // 243 Raikou
  3,    // 244 Entei
  3,    // 245 Suicune
  45,   // 246 Larvitar
  45,   // 247 Pupitar
  45,   // 248 Tyranitar
  3,    // 249 Lugia
  3,    // 250 Ho-Oh
  45,   // 251 Celebi
];
