import React, { useState, useCallback } from 'react';
import { useGameData } from '../utils/gameData';

import Data from './Data';

const Game = () => {
    const data = useGameData();
    const [input, setInput] = useState('');

    const submitInput = useCallback(() => {
        if (!input) {
            return;
        }
        if (!data.validate(input)) {
            window.alert('输入的不是成语');
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

    return (
        <div>
            <div>
                <button onClick={() => data.init()}>随机</button>
                <button onClick={() => data.restart()}>重新开始</button>
            </div>

            <Data data={data} />

            <div>
                <input value={input} onChange={e => setInput(e.target.value)} />
                <button onClick={submitInput}>确认</button>
            </div>
        </div>
    )
};

export default Game;
