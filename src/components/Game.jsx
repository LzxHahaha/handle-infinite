import React, { useState, useCallback, useEffect } from 'react';
import cnchar from 'cnchar';

import { useGameData, RETRY_TIMES, getSpell, updateIdiomSet, getCount } from '../utils/gameData';

import Data, { LIST_END_ID } from './Data';

import './Game.css';

let hintIndex = 0;

const Game = () => {
    const data = useGameData();
    const [input, setInput] = useState('');
    const [spell, setSpell] = useState('');
    const [allMode, setAllMode] = useState(false);

    const scrollToEnd = useCallback(() => {
        setTimeout(() => {
            const end = document.getElementById(LIST_END_ID);
            end && end.scrollIntoView(true);
        }, 50);
    }, []);

    const hint = useCallback(() => {
        window.alert(`当前词语包含：${data.answer[hintIndex]}`);
    }, [data]);

    const random = useCallback(() => {
        hintIndex = Math.floor(Math.random() * 10) % 4;
        setInput('');
        data.init();
    }, [data]);

    const switchSet = useCallback(() => {
        const v = !allMode;
        updateIdiomSet(v);
        setAllMode(v);
        random();
    }, [random, allMode]);

    const submitInput = useCallback(() => {
        if (!input) {
            return;
        }
        if (!data.validate(input)) {
            window.alert('输入有误');
            return;
        }
        try {
            data.match(input);
            setInput('');
            scrollToEnd();
        } catch (e) {
            console.error(e);
            window.alert(e.message);
        }
    }, [input, data, scrollToEnd]);

    const stop = useCallback(() => {
        data.stop();
        scrollToEnd();
    }, [data, scrollToEnd]);

    const submitKeyDown = useCallback(e => {
        if (e.key.toLocaleLowerCase() === 'enter') {
            e.preventDefault();
            e.stopPropagation();
            submitInput();
            return;
        }
    }, [submitInput]);

    useEffect(() => {
        let nextVal = '';
        const text = input.split('').filter(el => cnchar.isCnChar(el)).join('');
        nextVal = getSpell(text).join(' ');
        if (nextVal !== spell) {
            setSpell(nextVal);
        }
    }, [input, data, spell]);

    return (
        <div className="game">
            <div className="game-pane">
                <button onClick={random}>随机一题</button>
                <button onClick={data.restart}>重新开始</button>
                <button onClick={hint}>提示</button>
                <button onClick={stop}>查看答案</button>

                <hr/>

                <div className="rule">
                    <span className="rule-tag" style={{ color: 'green' }}>绿色</span>: 完全正确
                    <br />
                    <span className="rule-tag" style={{ color: 'orange' }}>黄色</span>: 位置错误
                    <br />
                    <span className="rule-tag" style={{ color: 'lightgray' }}>灰色</span>: 完全错误
                </div>

                <hr />

                <div className="data-set">
                    当前词库：
                    <br />
                    <span>{allMode ? '高级' : '常用'}词库 ({getCount()}词)</span>
                    <br/>
                    <button onClick={switchSet}>切换</button>
                </div>

                <hr/>

                <a
                    className="link"
                    href="https://handle.antfu.me/"
                    target="_blank"
                    rel="noreferrer"
                >
                    原版 汉兜
                </a>
                <a
                    className="link source"
                    href="https://github.com/LzxHahaha/handle-infinite"
                    target="_blank"
                    rel="noreferrer"
                >{"   ( ﾟ∀。) "}</a>
            </div>
            <div className="game-container">

                <h4 className="ans">
                    {data.isOver
                        ? (
                            <>
                                游戏结束，答案：
                                <a
                                    href={`https://www.bing.com/search?q=成语+${data.answer}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {data.answer}
                                </a>
                            </>
                        )
                        : `剩余次数：${RETRY_TIMES - data.history.length}`}
                </h4>

                <Data data={data} />

                <div className="spell">{spell || ' '}</div>
                <div className="game-input">
                    <input
                        value={input}
                        placeholder="请输入四字词语"
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={submitKeyDown}
                    />
                    <button
                        disabled={!input || data.isOver}
                        onClick={submitInput}
                    >
                        {data.isOver ? '游戏结束' : '确认'}
                    </button>
                </div>
            </div>
        </div>
    )
};

export default Game;
