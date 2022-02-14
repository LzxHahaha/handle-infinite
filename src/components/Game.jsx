import React, { useState, useCallback, useEffect, useRef } from "react";
import cnchar from "cnchar";
import { Button, Input, Divider, Modal, message } from "antd";
import {
  ArrowRightOutlined,
  RedoOutlined,
  BulbOutlined,
  FrownOutlined,
  QuestionOutlined,
  SettingOutlined,
  HeartTwoTone,
  MenuOutlined,
} from "@ant-design/icons";

import {
  useGameData,
  RETRY_TIMES,
  getSpellInfoList,
  updateIdiomSet,
  getCount,
  MatchStatus,
} from "../utils/gameData";

import Data, { LIST_END_ID, Pinyin } from "./Data";

import "./Game.css";

let hintIndex = 0;

const Game = () => {
  const data = useGameData();
  const inputRef = useRef();
  const [input, setInput] = useState("");
  const [spell, setSpell] = useState({});
  const [drawer, setDrawer] = useState(false);
  const [about, setAbout] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  const [allMode, setAllMode] = useState(false);
  const [enableInputColor, setEnableInputColor] = useState(true);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      const end = document.getElementById(LIST_END_ID);
      end && end.scrollIntoView(false);
    }, 50);
  }, []);

  const hint = useCallback(() => {
    message.info(
      <>
        当前词语包含：<b>{data.answer[hintIndex]}</b>
      </>
    );
    setDrawer(false);
  }, [data]);

  const random = useCallback(
    (slient) => {
      hintIndex = Math.floor(Math.random() * 10) % 4;
      setInput("");
      data.init();
      !slient && message.success("成了");
      setDrawer(false);
    },
    [data]
  );

  const restart = useCallback(() => {
    data.restart();
    setDrawer(false);
    message.success("假装什么都没发生");
  }, [data]);

  const submitInput = useCallback(() => {
    if (!input) {
      return;
    }
    if (!data.validate(input)) {
      message.error("输入有误");
      return;
    }
    try {
      data.match(input);
      setInput("");
      scrollToEnd();
      inputRef.current.blur();
    } catch (e) {
      console.error(e);
      message.error(e.message);
    }
  }, [input, data, scrollToEnd]);

  const stop = useCallback(() => {
    setDrawer(false);
    setTimeout(() => {
      data.stop();
      scrollToEnd();
    }, 50);
  }, [data, scrollToEnd]);

  const switchSet = useCallback(() => {
    const v = !allMode;
    updateIdiomSet(v);
    setAllMode(v);
    random(true);
  }, [random, allMode]);

  const openAbout = useCallback(() => {
    setAbout(true);
    setDrawer(false);
  }, []);

  const openSetting = useCallback(() => {
    setSettingVisible(true);
    setDrawer(false);
  }, []);

  useEffect(() => {
    const word = input
      .split("")
      .filter((el) => cnchar.isCnChar(el))
      .slice(0, 4)
      .join("");
    const val = getSpellInfoList(word);
    let spellTextArr = [];
    const info = val.map((el) => {
      spellTextArr.push(el.raw);
      return {
        tone: data.inputToneSet[el.tone] || MatchStatus.NO,
        initial: data.inputInitialSet[el.initial] || MatchStatus.NO,
        final: data.inputFinalSet[el.final] || MatchStatus.NO,
        rawSpell: el,
      };
    });
    const text = spellTextArr.join(" ");
    if (text !== spell.text) {
      setSpell({ text, info });
    }
  }, [input, data, spell]);

  return (
    <div className="game">
      <div className="game-pane">
        <Button onClick={random} shape="circle" icon={<ArrowRightOutlined />} />
        <Button onClick={data.restart} shape="circle" icon={<RedoOutlined />} />
        <Button
          onClick={() => setDrawer(true)}
          shape="circle"
          icon={<MenuOutlined />}
        />
      </div>

      <div className="game-container">
        <h4 className="ans">
          {data.isOver ? (
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
          ) : (
            `剩余次数：${RETRY_TIMES - data.history.length}`
          )}
        </h4>

        <Data data={data} />

        <div className="spell">
          {enableInputColor ? (spell.info || []).map((el, index) => (
            <>
              <Pinyin key={index} status={el} />
              &emsp;
            </>
          )) : spell.text}
        </div>
        <div>
          <Input.Search
            ref={inputRef}
            className="game-input"
            value={input}
            placeholder="请输入四字词语"
            enterButton={data.isOver ? "游戏结束" : "确认"}
            onChange={(e) => setInput(e.target.value)}
            onSearch={submitInput}
          />
        </div>
      </div>

      <Modal
        visible={about}
        title="关于"
        footer={null}
        centered
        onCancel={() => setAbout(false)}
      >
        <div className="about-container">
          <b>规则</b>
          <div className="rule">
            <span className="rule-tag" style={{ color: "green" }}>
              绿色
            </span>
            : 完全正确
            <br />
            <span className="rule-tag" style={{ color: "orange" }}>
              黄色
            </span>
            : 位置错误
            <br />
            <span className="rule-tag" style={{ color: "lightgray" }}>
              灰色
            </span>
            : 完全错误
          </div>
          <Divider />
          <div>
            <a
              className="link"
              href="https://handle.antfu.me/"
              target="_blank"
              rel="noreferrer"
            >
              原版汉兜
            </a>
            &emsp;/&emsp;
            <a
              className="link source"
              href="https://github.com/LzxHahaha/handle-infinite"
              target="_blank"
              rel="noreferrer"
            >
              {"   ( ﾟ∀。) "}
            </a>
          </div>
          <Divider />
          <div>如果喜欢的话，请点一下下面免费的红色小心心</div>
          <Button
            onClick={() =>
              message.success("虽然点了也没用，但还是谢谢你，你是个好人")
            }
            shape="circle"
            icon={<HeartTwoTone twoToneColor="#eb2f96" />}
          />
        </div>
      </Modal>

      <Modal
        visible={settingVisible}
        title="设置"
        footer={null}
        onCancel={() => setSettingVisible(false)}
      >
        <div className="setting-field">
          当前词库：
          {allMode ? "高级" : "常用"}词库 ({getCount()}词)&emsp;
          <Button shape="round" size="small" onClick={switchSet}>
            切换
          </Button>
        </div>

        <div className="setting-field">
          输入色彩辅助：已{enableInputColor ? "开启" : "关闭"}&emsp;
          <Button
            shape="round"
            size="small"
            onClick={() => setEnableInputColor((v) => !v)}
          >
            切换
          </Button>
        </div>
      </Modal>

      <Modal
        maskClosable
        closable={false}
        visible={drawer}
        footer={null}
        bodyStyle={{ bottom: 0 }}
        onCancel={() => setDrawer(false)}
      >
        <div className="drawer-menu">
          <Button onClick={random} icon={<ArrowRightOutlined />} block>
            下一题
          </Button>
          <Button onClick={restart} icon={<RedoOutlined />} block>
            重来
          </Button>
          <Button onClick={hint} icon={<BulbOutlined />} block>
            提示
          </Button>
          <Button onClick={stop} danger icon={<FrownOutlined />} block>
            答案
          </Button>
          <Divider />
          <Button onClick={openSetting} icon={<SettingOutlined />} block>
            设置
          </Button>
          <Button onClick={openAbout} icon={<QuestionOutlined />} block>
            关于
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Game;
