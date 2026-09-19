import { useRef, useState } from 'react';
import { Button, Center, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FaPlay, FaPause, FaVolumeUp, FaForward, FaBackward } from 'react-icons/fa';

/** Steps:
 * Play the stream
 * Play/Pause button
 * Volume slider?
 * left/right arrow buttons to skip between stream urls
 * update the stream url to be an array of urls with names
 * 
 */

export default function RadioPlayer( {isPortrait: _isPortrait}: {isPortrait: boolean} ) {
  const stations = [
    { name: 'WBGO', url: 'https://ais-sa8.cdnstream1.com/3629_128.mp3' },
    { name: 'Jazz24', url: 'https://knkx-live-a.edge.audiocdn.com/6285_128k' },
    { name: 'WNYC', url: 'https://fm939.wnyc.org/wnycfm'}
  ];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); //check that autoplay works on RaspPi (non Chrome)
  const [stationIndex, setStationIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      if (stationIndex < stations.length - 1) {
        setStationIndex(stationIndex + 1);
      } else {
        setStationIndex(0);
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      if (stationIndex > 0 ) {
        setStationIndex(stationIndex - 1);
      } else {
        setStationIndex(stations.length - 1);
      }
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  return (
    <Center w="100%" h="100%">
      <VStack spacing={2} alignItems="center">
        <Text fontSize="1.2em">{stations[stationIndex].name}</Text>
        <audio
          ref={audioRef}
          src={stations[stationIndex].url}
          autoPlay={true}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <HStack spacing={1}>
          <Button onClick={skipBackward} size="xs">
            <Icon as={FaBackward} />
          </Button>
          <Button onClick={togglePlay} size="xs">
            <Icon as={isPlaying ? FaPause : FaPlay} />
          </Button>
          <Button onClick={skipForward} size="xs">
            <Icon as={FaForward} />
          </Button>
        </HStack>
        <HStack>
          <Icon as={FaVolumeUp} boxSize="0.9em" />
          <Slider
            aria-label="volume"
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.1}
            w="4.5em"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </HStack>
      </VStack>
    </Center>
  )
}
