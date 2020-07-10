import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { isNil } from 'lodash';
import times from 'lodash/times';
import concat from 'lodash/concat';
import { useEffect } from 'react';

import getChildren from '../tools/getChildren';
import CAROUSEL_STRATEGIES from '../constants/carouselStrategies';
import { pluginNames } from '../constants/plugins';
import {
  activeSlideIndexState,
  slideWidthState,
  slidesState,
} from '../state/atoms/slideAtoms';
import {
  slideMovementState,
  trackStylesState,
  trackWidthState,
} from '../state/atoms/carouselAtoms';

const defaultOptions = {
  numberOfInfiniteClones: 1,
};

const infinite = ({ options = defaultOptions, carouselProps }) => {
  const itemWidth = useRecoilValue(slideWidthState);
  const children = getChildren(carouselProps.children, carouselProps.slides);

  const getTargetMod = (customValue = null) => {
    const value = isNil(customValue) ? carouselProps.value : customValue;
    const length = children.length;

    return value >= 0
      ? value % length
      : (length - Math.abs(value % length)) % length;
  };

  const getTargetSlide = () => {
    const mod = getTargetMod(0);

    return mod + carouselProps.value;
  };

  const getNeededAdditionalClones = () => {
    if (Math.abs(carouselProps.value) > children.length) {
      return Math.ceil(carouselProps.value / children.length);
    }
    return 0;
  };

  const getAdditionalClonesLeft = () => {
    const additionalClones = getNeededAdditionalClones();
    return additionalClones < 0 ? -additionalClones : 0;
  };

  const getAdditionalClonesOffset = () =>
    -children.length * itemWidth * getAdditionalClonesLeft();

  return {
    name: pluginNames.INFINITE,
    plugin: () => {
      const setTrackWidth = useSetRecoilState(trackWidthState);
      const setActiveSlideIndex = useSetRecoilState(activeSlideIndexState);
      const [trackStyles, setTrackStyles] = useRecoilState(trackStylesState);
      const setSlides = useSetRecoilState(slidesState);

      const numberOfInfiniteClones = options.numberOfInfiniteClones;

      const getAdditionalClonesRight = () => {
        const additionalClones = getNeededAdditionalClones();
        return additionalClones > 0 ? additionalClones : 0;
      };
      const getClonesLeft = () =>
        numberOfInfiniteClones + getAdditionalClonesLeft();
      const getClonesRight = () =>
        numberOfInfiniteClones + getAdditionalClonesRight();

      useEffect(() => {
        setActiveSlideIndex(
          getTargetSlide() + getClonesLeft() * children.length,
        );

        setTrackStyles({
          ...trackStyles,
          marginLeft: getAdditionalClonesOffset(),
        });
      }, [carouselProps.value]);

      useEffect(() => {
        const trackLengthMultiplier = 1 + getClonesLeft() + getClonesRight();

        const clonesLeft = times(getClonesLeft(), () => children);
        const clonesRight = times(getClonesRight(), () => children);

        setTrackWidth(
          carouselProps.width * children.length * trackLengthMultiplier,
        );
        setSlides(concat(...clonesLeft, children, ...clonesRight));
      }, [carouselProps.width, children.length, carouselProps.value]);
    },

    strategies: () => {
      const slideMovement = useRecoilValue(slideMovementState);
      const activeSlideIndex = useRecoilValue(activeSlideIndexState);

      const marginLeft = (slideMovement.marginLeft || '0')
        .match(/\d/g)
        .join('');

      return {
        [CAROUSEL_STRATEGIES.CHANGE_SLIDE]: (original) => original,
        [CAROUSEL_STRATEGIES.GET_CURRENT_VALUE]: () => carouselProps.value,
        [CAROUSEL_STRATEGIES.GET_TRANSFORM_OFFSET]: () => {
          const elementWidthWithOffset = itemWidth;
          const dragOffset = slideMovement.dragOffset;

          return (
            dragOffset -
            activeSlideIndex * elementWidthWithOffset -
            marginLeft -
            getAdditionalClonesOffset()
          );
        },
      };
    },
  };
};

export default infinite;
