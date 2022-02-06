import { cloneDeep } from 'lodash-es';

export class WordInfo {
    #textMap;
    #spellInitMap;
    #spellFinalMap;
    #spellToneMap;

    constructor(word, spellInfo) {
        this.#textMap = new Map();
        this.#spellInitMap = new Map();
        this.#spellFinalMap = new Map();
        this.#spellToneMap = new Map();
        for (let i = 0; i < 4; ++i) {
            const { initial, final, tone } = spellInfo[i];
            this.#initPositionMap(this.#textMap, word[i], i);
            this.#initPositionMap(this.#spellInitMap, initial, i);
            this.#initPositionMap(this.#spellFinalMap, final, i);
            this.#initPositionMap(this.#spellToneMap, tone, i);
        }
    }

    #initPositionMap(map, key, index) {
        if (!map.has(key)) {
            map.set(key, []);
        }
        const value = map.get(key);
        value.push(index);
    };

    clone() {
        return new WordInfoOperator(
            cloneDeep(this.#textMap),
            cloneDeep(this.#spellInitMap),
            cloneDeep(this.#spellFinalMap),
            cloneDeep(this.#spellToneMap)
        );
    }
}

export class WordInfoOperator {
    #textMap;
    #spellInitMap;
    #spellFinalMap;
    #spellToneMap;

    constructor(textMap, spellInitMap, spellFinalMap, spellToneMap) {
        this.#textMap = textMap;
        this.#spellInitMap = spellInitMap;
        this.#spellFinalMap = spellFinalMap;
        this.#spellToneMap = spellToneMap;
    }

    #remove(map, key, value) {
        const arr = map.get(key);
        if (!arr) {
            return;
        }
        if (arr.length === 1) {
            map.delete(key);
        } else if (value !== null) {
            const i = arr.findIndex(el => el === value);
            arr.splice(i, 1);
        } else {
            arr.unshift();
        }
    }

    tryRemoveSpellInitial(key) {
        if (this.#spellInitMap.has(key)) {
            this.removeSpellInitial(key, null);
            return true;
        }
        return false;
    }

    tryRemoveSpellFinal(key) {
        if (this.#spellFinalMap.has(key)) {
            this.removeSpellFinal(key, null);
            return true;
        }
        return false;
    }

    tryRemoveSpellTone(key) {
        if (this.#spellToneMap.has(key)) {
            this.removeSpellTone(key, null);
            return true;
        }
        return false;
    }

    tryRemoveChar(key) {
        if (this.#textMap.has(key)) {
            this.#remove(this.#textMap, key, null);
            return true;
        }
        return false;
    }

    removeSpellInitial(key, index) {
        this.#remove(this.#spellInitMap, key, index);
    }

    removeSpellFinal(key, index) {
        this.#remove(this.#spellFinalMap, key, index);
    }

    removeSpellTone(key, index) {
        this.#remove(this.#spellToneMap, key, index);
    }

    removeChar(char, spell, index) {
        this.#remove(this.#textMap, char, index);
        this.removeSpellInitial(spell.initial, index);
        this.removeSpellFinal(spell.final, index);
        this.removeSpellTone(spell.tone, index);
    }
}
