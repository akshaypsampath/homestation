import './App.css'
import { Box, Center, Flex, Heading, Spacer, VStack } from "@chakra-ui/react"
import {DateTime} from 'luxon'
import { useState, useEffect } from 'react'
import Weather from './components/Weather'
import Calendar from './components/Calendar'
import RadioPlayer from './components/RadioPlayer'
import TodoList from './components/TodoList'
import OpenMicsToday from './components/OpenMicsToday'

function App() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const [currentTime, setCurrentTime] = useState(DateTime.now());
  
  // Update time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now());
    }, 1000*30);

    return () => clearInterval(interval);
  }, []);

  console.log("isPortrait: ", isPortrait);
  return (
    isPortrait ? (
      <>
        <Flex w="100%" justifyContent="space-around" alignItems="center" p={4} className="marquee" >
          <Heading>{currentTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</Heading>
          <Heading color="red">{currentTime.toLocaleString(DateTime.TIME_SIMPLE)}</Heading>
        </Flex>
        <Center w="100%" h="20vh" borderRadius={30} overflow="hidden" bg="white.100"><Weather isPortrait={true}/></Center>
        <Flex w="100%" mt={2}>
          <VStack w="100%">
            <Box  w="98%" h="50.5vh" borderRadius={30} overflow="hidden" bgGradient="linear(to-t, blue.200, pink.200)"><Calendar isPortrait={true}/></Box>
            <Box  w="98%" h="20vh" borderRadius={30} bgGradient="linear(to-t, blue.100, gray.400)"><RadioPlayer isPortrait={true}/></Box>  

          </VStack>
          <Spacer />
          <VStack w="100%">
            <Box  w="98%" h="25vh" borderRadius={30} bgGradient="linear(to-t, blue.100, blue.200)"><TodoList isPortrait={true}/></Box>
            <Box  w="98%" h="25vh" borderRadius={30} bgGradient="linear(to-t, blue.100, blue.200)"><OpenMicsToday isPortrait={true}/></Box>
            <Box  w="98%" h="20vh" borderRadius={30} bgGradient="linear(to-t, green.200, green.500)">Spotify</Box>
          </VStack>
        </Flex>
      </>
    ) : (
      <>
        <Flex w="100%" justifyContent="space-around" alignItems="center" p={2} paddingTop={0} className="marquee">
          <Heading>{currentTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</Heading>
          <Heading color="red">{currentTime.toLocaleString(DateTime.TIME_SIMPLE)}</Heading>
        </Flex>
        <Flex w="100%" justifyContent="space-around" alignItems="center" p={4} gap={4}>
          <Box  w="12vw" h="20vh" borderRadius={30} bgGradient="linear(to-t, blue.100, gray.400)"><RadioPlayer isPortrait={false}/></Box>  
          <Center w="87vw" h="20vh" borderRadius={30} overflow="hidden" bg="white.100"><Weather isPortrait={false}/></Center>
        </Flex>
        <Flex w="100%" mt={2} gap={4}>
          <Box  w="40%" h="60vh" borderRadius={30} overflow="hidden" bgGradient="linear(to-t, blue.200, pink.200)"><Calendar isPortrait={false}/></Box>
          <Box  w="30%" h="60vh" borderRadius={30} bgGradient="linear(to-t, blue.100, blue.200)"><TodoList isPortrait={false}/></Box>
          <Box  w="30%" h="60vh" borderRadius={30} bgGradient="linear(to-t, blue.100, blue.200)"><OpenMicsToday isPortrait={false}/></Box>
        </Flex>
      </>
    )
  )
}

export default App
