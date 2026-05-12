/**
 * LegalityChecker.js — Lightweight legality checking for Gen1/Gen2.
 * Checks move legality, level bounds, EV/IV ranges, species validity.
 */
export class LegalityResult {
    constructor() {
        this.valid = true;
        this.warnings = [];
        this.errors = [];
    }

    addError(check, message) {
        this.valid = false;
        this.errors.push({ check, message, severity: 'invalid' });
    }

    addWarning(check, message) {
        this.warnings.push({ check, message, severity: 'fishy' });
    }
}

export class LegalityChecker {
    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     * Check a single Pokemon for legality issues.
     * @param {Object} pokemon - CanonicalPokemon or similar object
     * @returns {LegalityResult}
     */
    check(pokemon) {
        const result = new LegalityResult();

        this.checkSpecies(pokemon, result);
        this.checkLevel(pokemon, result);
        this.checkMoves(pokemon, result);
        this.checkEVs(pokemon, result);
        this.checkIVs(pokemon, result);

        if (this.adapter.generationId >= 2) {
            this.checkHeldItem(pokemon, result);
        }

        return result;
    }

    checkSpecies(pokemon, result) {
        const maxSpecies = this.adapter.getMaxSpecies();
        if (pokemon.dexId < 0 || pokemon.dexId > maxSpecies) {
            result.addError('species', `Invalid species ID: ${pokemon.dexId}`);
        }
    }

    checkLevel(pokemon, result) {
        if (pokemon.level < 1 || pokemon.level > 100) {
            result.addError('level', `Level ${pokemon.level} is out of range (1-100)`);
        }
    }

    checkMoves(pokemon, result) {
        if (!pokemon.moves) return;
        const maxMove = this.adapter.getMaxMoveId ? this.adapter.getMaxMoveId() : 251;
        for (let i = 0; i < pokemon.moves.length; i++) {
            const move = pokemon.moves[i];
            if (move.id === 0) continue; // Empty slot
            if (move.id < 0 || move.id > maxMove) {
                result.addError('moves', `Invalid move ID: ${move.id} in slot ${i + 1}`);
            }
            // Check PP bounds
            const maxPP = this.adapter.getMoveBasePP ? this.adapter.getMoveBasePP(move.id) : 40;
            if (move.pp < 0 || move.pp > maxPP + (maxPP * 3 / 5)) {
                result.addWarning('moves', `Move ${move.id} PP ${move.pp} seems invalid`);
            }
            if (move.ppUps < 0 || move.ppUps > 3) {
                result.addError('moves', `PP Ups ${move.ppUps} out of range (0-3)`);
            }
        }
    }

    checkEVs(pokemon, result) {
        if (!pokemon.evs) return;
        const maxEV = this.adapter.generationId >= 3 ? 252 : 65535;
        const evKeys = ['hp', 'attack', 'defense', 'speed'];
        if (this.adapter.generationId >= 2) {
            evKeys.push('spAttack', 'spDefense');
        } else {
            evKeys.push('special');
        }

        for (const key of evKeys) {
            if (pokemon.evs[key] !== undefined) {
                if (pokemon.evs[key] < 0 || pokemon.evs[key] > maxEV) {
                    result.addError('evs', `EV ${key} = ${pokemon.evs[key]} out of range (0-${maxEV})`);
                }
            }
        }
    }

    checkIVs(pokemon, result) {
        if (!pokemon.ivs) return;
        const maxIV = this.adapter.generationId >= 3 ? 31 : 15;
        const ivKeys = ['hp', 'attack', 'defense', 'speed'];
        if (this.adapter.generationId >= 2) {
            ivKeys.push('spAttack', 'spDefense');
        } else {
            ivKeys.push('special');
        }

        for (const key of ivKeys) {
            if (pokemon.ivs[key] !== undefined) {
                if (pokemon.ivs[key] < 0 || pokemon.ivs[key] > maxIV) {
                    result.addError('ivs', `IV ${key} = ${pokemon.ivs[key]} out of range (0-${maxIV})`);
                }
            }
        }
    }

    checkHeldItem(pokemon, result) {
        if (!pokemon.genExtension) return;
        const heldItem = pokemon.genExtension.heldItem;
        if (heldItem === undefined) return;
        const maxItem = this.adapter.getMaxItemId ? this.adapter.getMaxItemId() : 255;
        if (heldItem < 0 || heldItem > maxItem) {
            result.addError('heldItem', `Invalid held item ID: ${heldItem}`);
        }
    }
}
