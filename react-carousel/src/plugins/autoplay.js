import { useState } from 'react';
import { useSetRecoilState } from 'recoil';

import { pluginNames } from '../constants/plugins';
import { getCurrentValueSelector } from '../state/selectors/carouselSelectors';

let interval = null;

const defaultOptions = {
  interval: 2000,
};

const autoplay = ({ carouselProps, options = defaultOptions }) => ({
  name: pluginNames.AUTOPLAY,
  carouselCustomProps: () => {
    const changeSlide = useSetRecoilState(getCurrentValueSelector);
    const [autoPlayStopped, setAutoPlayStopped] = useState(false);

    const resetInterval = () => {
      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => {
        if (!document.hidden && !autoPlayStopped) {
          changeSlide(carouselProps.value + 1);
        }
      }, options.interval);
    };

    // setting autoplay interval
    resetInterval();

    /**
     * Function handling mouse hover over element
     * Stops auto play
     */
    const onMouseEnter = () => {
      setAutoPlayStopped(true);
    };

    /**
     * Function handling mouse leaving element
     * Resumes auto play
     */
    const onMouseLeave = () => {
      setAutoPlayStopped(false);
      resetInterval();
    };

    return {
      onMouseEnter,
      onMouseLeave,
    };
  },
});

export default autoplay;
