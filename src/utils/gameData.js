import { useState, useCallback, useEffect } from 'react';
import cnchar from 'cnchar';
import 'cnchar-idiom';
import 'cnchar-poly';

import { WordInfo } from './wordInfo';

export const RETRY_TIMES = 10;
const ANS_LENGTH = 4;

const IDIOMS = cnchar.idiom(['', '', '', '']).filter(el => el.length === ANS_LENGTH);
const IDIOMS_COUNT = IDIOMS.length;

export const MatchStatus = {
    UNKNOWN: '',
    NO: 'NO',
    VAL: 'VAL',
    ALL: 'ALL'
};

const getSpellInfoList = (word) => {
    return cnchar.spell(word, 'tone', 'array', 'low').map(el => cnchar.spellInfo(el));
};

export const useGameData = () => {
    const [ans, setAns] = useState('');
    const [ansInfo, setAnsInfo] = useState(null);
    const [spellInfo, setSpellInfo] = useState(null);
    const [history, setHistory] = useState([]);
    const [isOver, setIsOver] = useState(false);

    const init = useCallback((seed, urlAnswer) => {
        let seedIndex = 0;
        let initAns = '';
        if (urlAnswer && urlAnswer.length === ANS_LENGTH) {
            initAns = urlAnswer;
        } else {
            seedIndex = +seed;
            if (seed == null || isNaN(seedIndex)) {
                seedIndex = Math.floor(Math.random() * 100 * IDIOMS_COUNT) % IDIOMS_COUNT;
            } else {
                seedIndex = Math.abs(seedIndex) % IDIOMS_COUNT;
            }
            initAns = IDIOMS[seedIndex];
        }
        let retry = 0;
        while (retry < 10) {
            try {
                const initSpellInfo = getSpellInfoList(initAns);
                const initAnsInfo = new WordInfo(initAns, initSpellInfo);

                setAns(initAns);
                setSpellInfo(initSpellInfo);
                setAnsInfo(initAnsInfo);
                setHistory([]);
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

        for (let i = 0; i < ANS_LENGTH; ++i) {
            const inCh = input[i];
            const inSp = inputSpellInfo[i];
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
            }
            if (inSp.final === ansSp.final) {
                status.final = MatchStatus.ALL;
                clonedAnsInfo.removeSpellFinal(inSp.final, i);
            }
            if (inSp.tone === ansSp.tone) {
                status.tone = MatchStatus.ALL;
                clonedAnsInfo.removeSpellTone(inSp.tone, i);
            }
            res.push(status);
        }
        for (let i = 0; i < res.length; ++i) {
            const status = res[i];
            if (status.done) {
                continue;
            }
            status.text = status.text || (clonedAnsInfo.tryRemoveChar(input[i]) ? MatchStatus.VAL : MatchStatus.NO);
            status.initial = status.initial || (clonedAnsInfo.tryRemoveSpellInitial(status.rawSpell.initial) ? MatchStatus.VAL : MatchStatus.NO);
            status.final = status.final || (clonedAnsInfo.tryRemoveSpellFinal(status.rawSpell.final) ? MatchStatus.VAL : MatchStatus.NO);
            status.tone = status.tone || (clonedAnsInfo.tryRemoveSpellTone(status.rawSpell.tone) ? MatchStatus.VAL : MatchStatus.NO);
            status.done = true;
        }

        return res;
    }, [ans, ansInfo, spellInfo]);

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

        setHistory(prev => prev.concat({
            success: input === ans,
            input,
            result: matchResult(input)
        }));
    }, [ans, isOver, matchResult]);

    const restart = useCallback(() => {
        setHistory([]);
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
            history.length === RETRY_TIMES || history[history.length - 1].success
        );
        if (over !== isOver) {
            setIsOver(over);
        }
    }, [history, isOver]);

    return {
        answer: ans,
        spellInfo,
        history,
        isOver,
        init,
        match,
        validate,
        restart,
        stop
    };
}
