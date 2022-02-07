import React, { useState, useCallback } from 'react';
import { useGameData, RETRY_TIMES } from '../utils/gameData';

import Data from './Data';

import './Game.css';

let hintIndex = 0;

const Game = () => {
    const data = useGameData();
    const [input, setInput] = useState('');

    const hint = useCallback(() => {
        window.alert(`当前词语包含：${data.answer[hintIndex]}`);
    }, [data]);

    const random = useCallback(() => {
        hintIndex = Math.floor(Math.random() * 10) % 4;
        setInput('');
        data.init();
    }, [data]);

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
        } catch (e) {
            console.error(e);
            window.alert(e.message);
        }
    }, [input, data]);

    const submitKeyDown = useCallback(e => {
        if (e.key.toLocaleLowerCase() === 'enter') {
            e.preventDefault();
            e.stopPropagation();
            submitInput();
            return;
        }
    }, [submitInput]);

    return (
        <div className="game-container">
            <div className="game-header">
                <button onClick={() => random()}>随机一题</button>
                <button onClick={() => data.restart()}>重新开始</button>
                <button onClick={() => hint()}>提示</button>
                <button onClick={() => data.stop()}>查看答案</button>
            </div>
            <div className="rule">
                <span className="rule-tag" style={{ color: 'green' }}>绿色</span>: 完全正确
                <span className="rule-split" />
                <span className="rule-tag" style={{ color: 'orange' }}>黄色</span>: 位置错误
                <span className="rule-split" />
                <span className="rule-tag" style={{ color: 'lightgray' }}>灰色</span>: 完全错误
            </div>

            <h4 className="ans">
                {data.isOver
                    ? `游戏结束，答案：${data.answer}`
                    : `剩余次数：${RETRY_TIMES - data.history.length}`}
            </h4>

            <Data data={data} />

            <div>
                <input
                    value={input}
                    placeholder="请输入四字词语"
                    maxLength={4}
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
    )
};

export default Game;
