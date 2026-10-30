type LayerWithPopupState = {
  popupEnabled?: unknown;
};

type GraphicWithLayer = {
  layer?: unknown;
};

export const isPopupEnabledGraphic = (graphic: GraphicWithLayer | null | undefined) => {
  if (!graphic?.layer || typeof graphic.layer !== 'object') {
    return false;
  }

  return (graphic.layer as LayerWithPopupState).popupEnabled === true;
};
