import { Card, CardBody, Image, Spacer, Heading, Flex, Text, VStack, HStack } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { DateTime } from "luxon"

const baseUrl = 'https://api.weather.gov';
const userAgent = 'perfecttimeto.com/touchsomegrass, contact@perfecttimeto.com';


 const getGridPoint = async ({latitude, longitude}: any) => {
  try {
    const response = await fetch(`${baseUrl}/points/${latitude},${longitude}`, {
      headers: {
        'User-Agent': userAgent
      }
    });
    
    const data = await response.json();
    
    // Extract city and state from relativeLocation
    const city = data.properties.relativeLocation?.properties?.city || '';
    const state = data.properties.relativeLocation?.properties?.state || '';
    const cityState = city && state ? `${city}, ${state}` : `${latitude},${longitude}`;
    
    // Extract timezone
    const timezone = data.properties.timeZone || 'UTC';
    
    return {
      forecastOffice: data.properties.gridId,
      gridX: data.properties.gridX,
      gridY: data.properties.gridY,
      city: cityState,
      timezone: timezone
    };
  } catch (error) {
    throw new Error(`Failed to get grid points: ${error as string}`);
  }
}

const getForecastForGridPoint = async(forecastOffice: string, x: number, y: number) => {
  try {
    const response = await fetch(`${baseUrl}/gridpoints/${forecastOffice}/${x},${y}/forecast/hourly?units=us`, {
        headers: {
          'User-Agent': userAgent,
          'Feature-Flags':'forecast_temperature_qv,forecast_wind_speed_qv'
        }
      })
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to get hourly forecast: ${error as string}`);
  }
}

const getForecast = async(location: string) => {
  try {
    // Parse location - could be coordinates or location name
    let latitude: number, longitude: number;
    
    if (location.includes(',')) {
      // Location is coordinates
      [latitude, longitude] = location.split(',').map(coord => parseFloat(coord.trim()));
    } else {
      // For now, we'll need to geocode location names to coordinates
      // This is a simplified approach - in production you might want a geocoding service
      throw new Error('Location names not yet supported. Please use coordinates in format "latitude,longitude"');
    }

    // First get the grid points
    const { forecastOffice, gridX, gridY, city } = await getGridPoint({latitude, longitude});

    // Then get the hourly forecast
    const forecast = await getForecastForGridPoint(forecastOffice, gridX, gridY);

    return {
      success: true,
      location: {
        name: city,
        lat: latitude,
        long: longitude
      },
      data: forecast,
    };
  } catch (error) {
    return {
      success: false,
      location: { name: location, lat: 0, long: 0 },
      error: `Failed to get forecast: ${error as string}`,
    };
  }
}

export default function Weather( {isPortrait}: {isPortrait: boolean} ) {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getForecast('40.6956073,-73.9157087');
        const periods = data.data.properties?.periods || [];
        
        // Get current time
        const now = DateTime.now();
        
        // Filter periods to start from current hour onwards
        const futurePeriods = periods.filter((period: any) => {
          const periodTime = DateTime.fromISO(period.startTime);
          return periodTime >= now;
        });
        
        // Take the first 8 periods
        setForecast(futurePeriods.slice(0, 8));
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);


  // "linear(to-t, blue.200, white)" : "linear(to-t, gray.400, white)"
  const forecastCards = forecast.map((item: any) => {
    return (
      isPortrait ? (
        <Card key={item.number} h="100%" borderRadius={"2.5em"} bgGradient={item.isDaytime ? "linear(to-t, blue.50, blue.500)" : "linear(to-t, gray.100, gray.600)"}>
          <CardBody paddingStart={"0.5em"} paddingEnd={"0.5em"} paddingBottom={"1em"} h="100%" display="flex" flexDirection="column" justifyContent="space-between">
            <Heading fontSize="1.5em" color="white" w="100%" >{DateTime.fromISO(item.startTime).toLocaleString(DateTime.TIME_SIMPLE)}</Heading>
            <Image src={item.icon} alt={item.name} width="4.5em" height="4.5em" p={1} alignSelf="center" justifySelf="center"/>
            <VStack spacing={0}>
              <Text fontSize="1.7em" p={0} marginTop={"0em"} marginBottom={"0"}>{((item.temperature.value)*1.8+32).toFixed(0)}°{item.temperature.unit}</Text>
              <HStack alignItems="baseline" justifyContent="space-around" gap={0}>
                <Text fontSize="1.4em" >{item.probabilityOfPrecipitation.value}</Text>
                <Text fontSize="0.8em" >%</Text>
                <Text fontSize="1.5em" >☔️</Text>
              </HStack>
            </VStack>
            <Text fontSize="0.5em">{item.shortForecast}</Text>
            <Text fontSize="0.5em">{((item.windSpeed.value)*0.621371).toFixed(0)} mph</Text>
          </CardBody>
        </Card>
      ) : (
        <Card w="12%" key={item.number} h="100%" borderRadius={"4vh"} alignItems="center" justifyContent="center" bgGradient={item.isDaytime ? "linear(to-t, blue.50, blue.500)" : "linear(to-t, gray.100, gray.600)"}>
          <CardBody paddingTop={"2vh"} paddingBottom={"1vh"} h="100%" display="flex" flexDirection="column" justifyContent="space-between">
            <Heading fontSize="1.5em" color="white" w="100%" >{DateTime.fromISO(item.startTime).toLocaleString(DateTime.TIME_SIMPLE)}</Heading>
            <Flex>
              <Image src={item.icon} alt={item.name} width="5em" height="3em" p={0} alignSelf="center" justifySelf="center"/>
              <Spacer width="2vh" />
              <VStack width="100%" spacing={0}>
                <Text fontSize="3vh" >{((item.temperature.value)*1.8+32).toFixed(0)}°{item.temperature.unit}</Text>
                <HStack alignItems="baseline" justifyContent="space-around" gap={0}>
                  <Text fontSize="2.5vh" >{item.probabilityOfPrecipitation.value}</Text>
                  <Text fontSize="1.1vh" >%</Text>
                  <Text fontSize="2.5vh" >☔️</Text>
                </HStack>
              </VStack>
            </Flex>
            <Text fontSize="1.7vh">{item.shortForecast}</Text>
            <Text fontSize="1.5vh">{((item.windSpeed.value)*0.621371).toFixed(0)} mph</Text>
          </CardBody>
        </Card>
      )
    )
  })

  if (loading) {
    return <Text>Loading weather...</Text>;
  }

  return (
    <>
      <Flex gap={1} w="100%" h="100%" justifyContent="space-between" alignItems="stretch">
        {forecastCards}
      </Flex>
    </> 
  )
}