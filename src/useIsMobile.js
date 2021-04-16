import { useWindowWidth } from '@react-hook/window-size';
import config from './config';

export default function useIsMobile() {
  const windowWidth = useWindowWidth();

  return windowWidth < config.maxMobileWidth;
}
