import { useState, useCallback, useEffect } from 'react';
import cnchar from 'cnchar';
import 'cnchar-idiom';
import 'cnchar-poly';
import pinyin from 'pinyin';

import { BASIC_IDIOMS } from "./idiom";

import { WordInfo } from './wordInfo';

export const RETRY_TIMES = 10;
const ANS_LENGTH = 4;

const ALL_IDIOMS = cnchar.idiom(['', '', '', '']).filter(el => el.length === ANS_LENGTH);
let IDIOMS = BASIC_IDIOMS;
let IDIOMS_COUNT = IDIOMS.length;

export const MatchStatus = {
    UNKNOWN: '',
    NO: 'NO',
    VAL: 'VAL',
    ALL: 'ALL',
    CONTAIN: 'CONTAIN',
    NOT_CONTAIN: 'NOT_CONTAIN'
};

export const updateIdiomSet = (allIdioms) => {
    IDIOMS = allIdioms ? ALL_IDIOMS : BASIC_IDIOMS;
    IDIOMS_COUNT = IDIOMS.length;
};

export const getCount = () => IDIOMS_COUNT;

export const getSpell = (word) => {
    return pinyin(word, {
        segment: true
    }).map(el => el[0]);
};

export const getSpellInfoList = (word) => {
    return getSpell(word).map(el => ({
        ...cnchar.spellInfo(el),
        raw: el
    }));
};

export const useGameData = () => {
    const [ans, setAns] = useState('');
    const [ansInfo, setAnsInfo] = useState(null);
    const [spellInfo, setSpellInfo] = useState(null);
    const [history, setHistory] = useState([]);
    const [isOver, setIsOver] = useState(false);
    const [inputSpellSet, setInputSpellSet] = useState({
        initial: {},
        final: {},
        tone: {}
    });

    const init = useCallback(() => {
        let seedIndex = Math.floor(Math.random() * 100 * IDIOMS_COUNT) % IDIOMS_COUNT;
        let initAns = IDIOMS[seedIndex];

        let retry = 0;
        while (retry < 10) {
            try {
                const initSpellInfo = getSpellInfoList(initAns);
                const initAnsInfo = new WordInfo(initAns, initSpellInfo);

                setAns(initAns);
                setSpellInfo(initSpellInfo);
                setAnsInfo(initAnsInfo);
                setHistory([]);
                setIsOver(false);
                setInputSpellSet({
                    initial: {},
                    final: {},
                    tone: {}
                });
                break;
            } catch (e) {
                console.error(initAns, e);
                seedIndex = (seedIndex + 123) % IDIOMS_COUNT;
                initAns = IDIOMS[seedIndex];
                ++retry;
            }
        }
    }, []);

    const matchResult = useCallback((input) => {
        const clonedAnsInfo = ansInfo.clone();
        const inputSpellInfo = getSpellInfoList(input);
        const res = [];
        const iniSet = { ...inputSpellSet.initial };
        const finSet = { ...inputSpellSet.final };
        const tonSet = { ...inputSpellSet.tone };

        for (let i = 0; i < ANS_LENGTH; ++i) {
            const inCh = input[i];
            const inSp = inputSpellInfo[i];
            iniSet[inSp.initial] = iniSet[inSp.initial] || MatchStatus.NOT_CONTAIN;
            finSet[inSp.final] = finSet[inSp.final] || MatchStatus.NOT_CONTAIN;
            tonSet[inSp.tone] = tonSet[inSp.tone] || MatchStatus.NOT_CONTAIN;
            if (inCh === ans[i]) {
                res.push({
                    done: true,
                    text: MatchStatus.ALL,
                    initial: MatchStatus.ALL,
                    final: MatchStatus.ALL,
                    tone: MatchStatus.ALL,
                    rawSpell: inSp
                });
                clonedAnsInfo.removeChar(inCh, inSp, i);
                iniSet[inSp.initial] = MatchStatus.CONTAIN;
                finSet[inSp.final] = MatchStatus.CONTAIN;
                tonSet[inSp.tone] = MatchStatus.CONTAIN;
                continue;
            }
            const ansSp = spellInfo[i];
            const status = {
                done: false,
                text: MatchStatus.UNKNOWN,
                initial: MatchStatus.UNKNOWN,
                final: MatchStatus.UNKNOWN,
                tone: MatchStatus.UNKNOWN,
                rawSpell: inSp
            };
            if (inSp.initial === ansSp.initial) {
                status.initial = MatchStatus.ALL;
                clonedAnsInfo.removeSpellInitial(inSp.initial, i);
                iniSet[inSp.initial] = MatchStatus.CONTAIN;
            }
            if (inSp.final === ansSp.final) {
                status.final = MatchStatus.ALL;
                clonedAnsInfo.removeSpellFinal(inSp.final, i);
                finSet[inSp.final] = MatchStatus.CONTAIN;
            }
            if (inSp.tone === ansSp.tone) {
                status.tone = MatchStatus.ALL;
                clonedAnsInfo.removeSpellTone(inSp.tone, i);
                tonSet[inSp.tone] = MatchStatus.CONTAIN;
            }
            res.push(status);
        }
        for (let i = 0; i < res.length; ++i) {
            const status = res[i];
            if (status.done) {
                continue;
            }
            status.text = status.text || (clonedAnsInfo.tryRemoveChar(input[i]) ? MatchStatus.VAL : MatchStatus.NO);
            if (!status.initial) {
                if (clonedAnsInfo.tryRemoveSpellInitial(status.rawSpell.initial)) {
                    status.initial = MatchStatus.VAL;
                    iniSet[status.rawSpell.initial] = MatchStatus.CONTAIN;
                } else {
                    status.initial = MatchStatus.NO;
                }
            }
            if (!status.final) {
                if (clonedAnsInfo.tryRemoveSpellFinal(status.rawSpell.final)) {
                    status.final = MatchStatus.VAL;
                    finSet[status.rawSpell.final] = MatchStatus.CONTAIN;
                } else {
                    status.final = MatchStatus.NO;
                }
            }
            if (!status.tone) {
                if (clonedAnsInfo.tryRemoveSpellTone(status.rawSpell.tone)) {
                    status.tone = MatchStatus.VAL;
                    tonSet[status.rawSpell.tone] = MatchStatus.CONTAIN;
                } else {
                    status.tone = MatchStatus.NO;
                }
            }
            status.done = true;
        }

        return { res, iniSet, finSet, tonSet };
    }, [ans, ansInfo, spellInfo, inputSpellSet]);

    const validate = useCallback((input) => {
        if (!input || input.length !== 4) {
            return false;
        }
        try {
            getSpellInfoList(input);
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    const match = useCallback((input) => {
        if (isOver) {
            return;
        }

        const { res, iniSet, finSet, tonSet } = matchResult(input);
        setHistory(prev => prev.concat({
            success: input === ans,
            input,
            result: res
        }));
        setInputSpellSet({
            initial: iniSet,
            final: finSet,
            tone: tonSet
        });
    }, [ans, isOver, matchResult]);

    const restart = useCallback(() => {
        setIsOver(false);
        setHistory([]);
        setInputSpellSet({
            initial: {},
            final: {},
            tone: {}
        });
    }, []);

    const stop = () => {
        match(ans);
    };

    useEffect(() => {
        const url = new URL(window.location);
        let urlSeed = url.searchParams.get('seed');
        let urlAnswer = url.searchParams.get('ans');

        init(urlSeed, urlAnswer);
    }, [init]);

    useEffect(() => {
        let over = !!history.length && (
            history.length >= RETRY_TIMES || history[history.length - 1].success
        );
        if (over !== isOver) {
            setIsOver(over);
        }
    }, [history, isOver]);

    return {
        answer: ans,
        spellInfo,
        inputInitialSet: inputSpellSet.initial,
        inputFinalSet: inputSpellSet.final,
        inputToneSet: inputSpellSet.tone,
        history,
        isOver,
        init,
        match,
        validate,
        restart,
        stop
    };
}
