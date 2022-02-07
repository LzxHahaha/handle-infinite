import React from "react";

import "./Bar.css";

const Bar = () => {
    return (
        <div className="bar">
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
    );
};

export default Bar;
