import React from "react";
import { Box, Coins, Sparkles } from "lucide-react";
import clickSoundUrl from "../../sounds/caseclick.mp3";
import { pickWeightedDrop, prepareDrop } from "../lib/caseOpening.js";
import { formatCurrency } from "../lib/format.js";
import { getRarityTone } from "../lib/rarity.js";
import { CasePreviewArt } from "./CasePreviewArt.jsx";

const REEL_ITEM_WIDTH = 134;
const REEL_ITEM_GAP = 10;
const REEL_ITEM_STEP = REEL_ITEM_WIDTH + REEL_ITEM_GAP;
const REEL_SIZE = 58;
const WINNING_INDEX = 44;
const SPIN_DURATION = 5600;

export function CaseOpeningReel({
  caseItem,
  currentUser,
  onOpenCase,
  onSellInventoryItem,
  priceLabel,
}) {
  const reelRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const openingLockRef = React.useRef(false);
  const spinTimersRef = React.useRef([]);
  const clickPoolRef = React.useRef([]);
  const clickPoolIndexRef = React.useRef(0);
  const [reelItems, setReelItems] = React.useState([]);
  const [spinState, setSpinState] = React.useState("idle");
  const [winningDrop, setWinningDrop] = React.useState(null);
  const [openedInventoryItem, setOpenedInventoryItem] = React.useState(null);
  const [isSold, setIsSold] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState(null);
  const [spinRun, setSpinRun] = React.useState(null);

  React.useEffect(() => {
    clickPoolRef.current = Array.from({ length: 7 }, () => {
      const audio = new Audio(clickSoundUrl);
      audio.preload = "auto";
      audio.volume = 0.42;
      return audio;
    });

    return () => {
      clickPoolRef.current.forEach((audio) => {
        audio.pause();
      });
      clickPoolRef.current = [];
    };
  }, []);

  React.useEffect(() => {
    if (!spinRun || spinState !== "spinning") return undefined;

    const track = trackRef.current;
    const reel = reelRef.current;
    if (!track || !reel) return undefined;

    const targetTranslate =
      reel.clientWidth / 2 -
      (WINNING_INDEX * REEL_ITEM_STEP +
        REEL_ITEM_WIDTH / 2 +
        spinRun.landingOffset);

    clearSpinTimers();
    track.style.transition = "none";
    track.style.transform = "translate3d(0px, 0, 0)";

    const startTimer = window.setTimeout(() => {
      spinTimersRef.current.push(
        ...scheduleClickTimers(reel, targetTranslate, playClick)
      );

      track.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.33, 1, 0.68, 1)`;
      track.style.transform = `translate3d(${targetTranslate}px, 0, 0)`;
    }, 40);

    const doneTimer = window.setTimeout(() => {
      track.style.transition = "none";
      track.style.transform = `translate3d(${targetTranslate}px, 0, 0)`;
      setActionMessage({
        status: "success",
        text: spinRun.message ?? "Pokemon wurde ins Inventar gelegt.",
      });
      openingLockRef.current = false;
      setSpinState("done");
    }, SPIN_DURATION + 120);

    spinTimersRef.current.push(startTimer, doneTimer);

    return () => {
      clearSpinTimers();
    };
  }, [reelItems.length, spinRun, spinState]);

  function playClick() {
    const clickPool = clickPoolRef.current;
    if (!clickPool.length) return;

    const audio = clickPool[clickPoolIndexRef.current % clickPool.length];
    clickPoolIndexRef.current += 1;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function primeClickAudio() {
    const audio = new Audio(clickSoundUrl);
    audio.volume = 0;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
      })
      .catch(() => {});
  }

  function clearSpinTimers() {
    spinTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    spinTimersRef.current = [];
  }

  function startOpening() {
    if (spinState === "spinning" || openingLockRef.current) return;

    if (!currentUser) {
      setActionMessage({
        status: "error",
        text: "Bitte melde dich an, um Kisten zu oeffnen.",
      });
      return;
    }

    openingLockRef.current = true;
    const openingResult = onOpenCase?.(caseItem);

    if (!openingResult?.ok) {
      openingLockRef.current = false;
      setActionMessage({
        status: "error",
        text: openingResult?.message ?? "Kiste konnte nicht geoeffnet werden.",
      });
      return;
    }

    const preparedWinner = openingResult.drop;
    const nextItems = buildReelItems(caseItem, preparedWinner);
    primeClickAudio();
    clearSpinTimers();

    setWinningDrop(preparedWinner);
    setOpenedInventoryItem(openingResult.item ?? null);
    setIsSold(false);
    setActionMessage(null);
    setReelItems(nextItems);
    setSpinState("spinning");
    setSpinRun({
      id: crypto.randomUUID(),
      landingOffset: getLandingOffset(),
      message: openingResult.message,
      winningDrop: preparedWinner,
    });
  }

  function handleSellDirectly() {
    if (!openedInventoryItem || isSold) return;

    const result = onSellInventoryItem?.(openedInventoryItem.id);

    if (result?.ok) {
      setIsSold(true);
    }

    if (result) {
      setActionMessage({
        status: result.ok ? "success" : "error",
        text: result.message,
      });
    }
  }

  const isSpinning = spinState === "spinning";
  const showReel = spinState !== "idle";

  return (
    <div className="case-opening">
      {showReel ? (
        <div
          className="case-opening-reel"
          data-status={spinState}
          ref={reelRef}
        >
          <span className="case-opening-reel__marker case-opening-reel__marker--top" />
          <span className="case-opening-reel__marker case-opening-reel__marker--bottom" />
          <span className="case-opening-reel__line" />
          <div className="case-opening-reel__fade case-opening-reel__fade--left" />
          <div className="case-opening-reel__fade case-opening-reel__fade--right" />

          <div className="case-opening-track" ref={trackRef}>
            {reelItems.map((drop, index) => (
              <ReelItem
                drop={drop}
                isWinner={spinState === "done" && index === WINNING_INDEX}
                key={`${drop.reelId}-${index}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="stage-frame">
          <span className="stage-marker stage-marker--top" />
          <CasePreviewArt
            caseItem={caseItem}
            name={caseItem.name}
            sprites={caseItem.previewSprites}
          />
          <span className="stage-marker stage-marker--bottom" />
        </div>
      )}

      <div className="open-panel">
        <strong>{priceLabel}</strong>
        {spinState === "done" ? null : (
          <button
            className="primary-button primary-button--wide"
            disabled={isSpinning}
            onClick={startOpening}
            type="button"
          >
            <Box aria-hidden="true" size={18} strokeWidth={2} />
            {isSpinning ? "Öffnet..." : "Öffnen"}
          </button>
        )}
      </div>

      {spinState === "done" && winningDrop ? (
        <div
          className="case-opening-result"
          data-rarity={getRarityTone(winningDrop.rarity)}
        >
          <Sparkles aria-hidden="true" size={20} strokeWidth={2} />
          <span>{isSold ? "Verkauft" : "Gezogen"}</span>
          <strong>{winningDrop.pokemon}</strong>
          <b>{formatCurrency(winningDrop.value)} Credits</b>
          <div className="case-opening-result__actions">
            <button
              className="secondary-button"
              disabled={isSold || !openedInventoryItem}
              onClick={handleSellDirectly}
              type="button"
            >
              <Coins aria-hidden="true" size={17} strokeWidth={2} />
              Direkt verkaufen
            </button>
            <button
              className="primary-button primary-button--wide"
              onClick={startOpening}
              type="button"
            >
              <Box aria-hidden="true" size={17} strokeWidth={2} />
              Nochmal
            </button>
          </div>
        </div>
      ) : null}

      {actionMessage ? (
        <p className="form-message" data-status={actionMessage.status}>
          {actionMessage.text}
        </p>
      ) : null}
    </div>
  );
}

function ReelItem({ drop, isWinner }) {
  return (
    <article
      className="case-opening-item"
      data-rarity={getRarityTone(drop.rarity)}
      data-shiny={drop.shiny ? "true" : "false"}
      data-winner={isWinner ? "true" : "false"}
    >
      <img
        alt=""
        data-fallback={drop.fallbackImage}
        onError={handleImageFallback}
        src={drop.image}
      />
      <strong>{drop.pokemon}</strong>
      <span>{formatCurrency(drop.value)} Credits</span>
    </article>
  );
}

function buildReelItems(caseItem, winner) {
  return Array.from({ length: REEL_SIZE }, (_, index) => {
    const drop =
      index === WINNING_INDEX ? winner : pickWeightedDrop(caseItem.items);
    return {
      ...prepareDrop(drop, caseItem),
      reelId: crypto.randomUUID(),
    };
  });
}

function handleImageFallback(event) {
  const fallbackImage = event.currentTarget.dataset.fallback;
  if (!fallbackImage || event.currentTarget.src === fallbackImage) return;
  event.currentTarget.src = fallbackImage;
}

function getLandingOffset() {
  const maxOffset = REEL_ITEM_WIDTH * 0.28;
  return Math.random() * maxOffset * 2 - maxOffset;
}

function scheduleClickTimers(reel, targetTranslate, playClick) {
  const timers = [];
  const startCenter = reel.clientWidth / 2;
  const endCenter = reel.clientWidth / 2 - targetTranslate;
  const travelDistance = endCenter - startCenter;
  const firstCrossedIndex = Math.floor(startCenter / REEL_ITEM_STEP) + 1;
  const lastCrossedIndex = Math.min(
    Math.floor(endCenter / REEL_ITEM_STEP),
    REEL_SIZE - 1
  );

  for (let index = firstCrossedIndex; index <= lastCrossedIndex; index += 1) {
    const boundaryPosition = index * REEL_ITEM_STEP;
    const progress = (boundaryPosition - startCenter) / travelDistance;

    if (progress <= 0 || progress >= 1) continue;

    const clickTime = inverseEaseOutCubic(progress) * SPIN_DURATION;
    timers.push(window.setTimeout(playClick, clickTime));
  }

  return timers;
}

function inverseEaseOutCubic(value) {
  return 1 - Math.pow(1 - value, 1 / 3);
}
