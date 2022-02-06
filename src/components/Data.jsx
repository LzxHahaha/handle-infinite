import React from 'react';

import { MatchStatus } from '../utils/gameData';

import "./Data.css";

const toneChar = ['', 'ˉ', 'ˊ', 'ˇ', 'ˋ'];
const statusClass = {
    [MatchStatus.ALL]: 'all',
    [MatchStatus.VAL]: 'val',
    [MatchStatus.NO]: 'no'
}

const updatePinyinChar = (ch, index, toneIndex) => {
    if (toneIndex !== index) {
        return ch;
    }
    if (ch === 'i') {
        return 'ı';
    }
    if (ch === 'ü') {
        return 'u';
    }
    return ch;
};

const Pinyin = ({ status }) => {
    const { initial, final, tone, rawSpell } = status;
    const style = {
        gridTemplateColumns: `repeat(${rawSpell.spell.length}, 12px)`
    }
    const spellArr = rawSpell.spell.split('');
    const toneIndex = rawSpell.index - 1;
    return (
        <div className="pinyin" style={style}>
            {spellArr.map((el, index) => (
                <div key={`${index}-${rawSpell.tone}`} className={`tone ${statusClass[tone]}`}>
                    {index === toneIndex ? toneChar[rawSpell.tone] : ''}
                </div>
            ))}
            {rawSpell.initial.split('').map((el, index) => (
                <div key={`${el}-${index}`} className={statusClass[initial]}>
                    {updatePinyinChar(el, index, toneIndex)}
                </div>
            ))}
            {rawSpell.final.split('').map((el, index) => (
                <div key={`${el}-${index}`} className={statusClass[final]}>
                {updatePinyinChar(el, index + rawSpell.initial.length, toneIndex)}
                </div>
            ))}
        </div>
    );
};

const Char = ({ text, status }) => {
    return (
        <div className={`char ${statusClass[status]}`}>
            {text}
        </div>
    );
};

const MatchItem = ({ data }) => {
    return (
        <div className="history-row">
            {data.result.map((el, index) => (
                <div key={`${data.input[index]}-${index}`} className="word">
                    <Pinyin status={el} />
                    <Char text={data.input[index]} status={el.text} />
                </div>
            ))}
        </div>
    );
};

const Data = ({ data }) => {
    if (!data) {
        return null;
    }
    return (
        <div>
            {data.history.map((el, index) => (
                <MatchItem key={`${el.input}-${index}`} data={el} />
            ))}
        </div>
    )
};

export default Data;
