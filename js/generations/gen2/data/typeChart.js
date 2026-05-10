/**
 * Gen 2 Type Effectiveness Chart (Gold / Silver / Crystal)
 *
 * 17 types (indices 0–16):
 *   0  Normal      5  Rock       10 Water     15 Dragon
 *   1  Fighting    6  Bug        11 Grass     16 Dark
 *   2  Flying      7  Ghost      12 Electric
 *   3  Poison      8  Steel      13 Ice
 *   4  Ground      9  Fire       14 Psychic
 *
 * GEN2_TYPE_CHART[attacker][defender] → effectiveness multiplier
 *   0   = immune (no effect)
 *   0.5 = not very effective
 *   1   = normal effectiveness
 *   2   = super effective
 *
 * Key differences from Gen 1:
 *   - Bug is now super effective against Poison and Dark (was NVE in Gen 1)
 *   - Ghost is now super effective against Psychic (was no effect in Gen 1 due to a bug)
 *   - Ice now resists Ice (neutral in Gen 1)
 *   - Poison is now super effective against Bug (was NVE in Gen 1)
 *   - New type Steel: immune to Poison; resists Normal, Grass, Ice, Flying, Psychic,
 *     Bug, Rock, Ghost, Dragon, Dark, Steel; weak to Fire, Ground, Fighting
 *   - New type Dark: immune to Psychic; weak to Bug and Fighting;
 *     super effective against Ghost and Psychic
 *   - Fire resists Ice in Gen 2
 */

export const GEN2_TYPE_CHART = [
  //                    Nor Fig Fly Poi Gro Roc Bug Gho Ste Fir Wat Gra Ele Icy Psy Dra Dar
  /* Normal     */  [  1,   1,  1,  1,  1, 0.5,  1,  0, 0.5,  1,  1,  1,  1,  1,  1,  1,  1],
  /* Fighting   */  [  1,   1,0.5,0.5,  1,  2,0.5,  0,  2,  1,  1,  1,  1,  2,0.5,  1,  2],
  /* Flying     */  [  1,   2,  1,  1,  1,0.5,  2,  1,0.5,  1,  1,  2,0.5,  1,  1,  1,  1],
  /* Poison     */  [  1,   1,  1,0.5,0.5,0.5,  2,0.5,  0,  1,  1,  2,  1,  1,  1,  1,  1],
  /* Ground     */  [  1,   1,  0,  2,  1,  2,  1,  1,  2,  2,  1,0.5,  2,  1,  1,  1,  1],
  /* Rock       */  [  1,0.5,  2,  1,0.5,  1,  2,  1,0.5,  2,  1,  1,  1,  2,  1,  1,  1],
  /* Bug        */  [  1,0.5,0.5,  2,  1,  1,  1,0.5,0.5,0.5,  1,  2,  1,  1,  2,  1,  2],
  /* Ghost      */  [  0,   1,  1,  1,  1,  1,  1,  2,  1,  1,  1,  1,  1,  1,  2,  1,0.5],
  /* Steel      */  [  1,   1,  1,  1,  1,  2,  1,  1,0.5,0.5,0.5,  1,0.5,  2,  1,  1,  1],
  /* Fire       */  [  1,   1,  1,  1,  1,0.5,  2,  1,  2,0.5,0.5,  2,  1,  2,  1,  1,  1],
  /* Water      */  [  1,   1,  1,  1,  2,  2,  1,  1,  1,  2,0.5,0.5,  1,  1,  1,  1,  1],
  /* Grass      */  [  1,   1,  1,  1,  2,  2,  1,  1,0.5,0.5,  2,0.5,  1,  1,  1,  1,  1],
  /* Electric   */  [  1,   1,  2,  1,  0,  1,  1,  1,  1,  1,  2,0.5,0.5,  1,  1,  1,  1],
  /* Ice        */  [  1,   1,  2,  1,  2,  1,  1,  1,0.5,0.5,0.5,  2,  1,0.5,  1,  1,  1],
  /* Psychic    */  [  1,   2,  1,  2,  1,  1,  1,  1,0.5,  1,  1,  1,  1,  1,0.5,  1,  0],
  /* Dragon     */  [  1,   1,  1,  1,  1,  1,  1,  1,0.5,  1,  1,  1,  1,  1,  1,  2,  1],
  /* Dark       */  [  1,0.5,  1,  1,  1,  1,  1,  2,0.5,  1,  1,  1,  1,  1,  2,  1,0.5],
];

/**
 * Type names in Gen 2 index order (0–16).
 * @type {string[]}
 */
export const GEN2_TYPE_NAMES = [
  'Normal',
  'Fighting',
  'Flying',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Steel',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Ice',
  'Psychic',
  'Dragon',
  'Dark',
];

/**
 * Type colors for UI display (standard Pokémon type palette).
 * @type {Object<string, string>}
 */
export const GEN2_TYPE_COLORS = {
  Normal:   '#A8A878',
  Fighting: '#C03028',
  Flying:   '#A890F0',
  Poison:   '#A040A0',
  Ground:   '#E0C068',
  Rock:     '#B8A038',
  Bug:      '#A8B820',
  Ghost:    '#705898',
  Steel:    '#B8B8D0',
  Fire:     '#F08030',
  Water:    '#6890F0',
  Grass:    '#78C850',
  Electric: '#F8D030',
  Ice:      '#98D8D8',
  Psychic:  '#F85888',
  Dragon:   '#7038F8',
  Dark:     '#705848',
};


