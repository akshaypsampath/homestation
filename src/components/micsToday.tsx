import { Box, Image, Text, Center } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { findDocumentByName, getDocumentImagesByDay, isAuthenticated } from "../services/google-auth-service";

export default function MicsToday({ isPortrait: _isPortrait }: { isPortrait: boolean }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMicImage = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Find the document by name
        console.log('Searching for document: small print Eye Candy Mic List - Fall 2025');
        const documentId = await findDocumentByName("small print Eye Candy Mic List - Fall 2025");
        console.log('Found document ID:', documentId);
        
        if (!documentId) {
          throw new Error('Document ID not found');
        }
        
        // Get images organized by day
        console.log('Fetching document images for ID:', documentId);
        const imagesByDay = await getDocumentImagesByDay(documentId);
        console.log('Retrieved images by day:', imagesByDay);
        
        // Get current day of the week
        const currentDay = DateTime.now().toFormat('EEEE'); // Full day name (Monday, Tuesday, etc.)
        console.log('Current day:', currentDay);
        
        // Find image for current day
        const dayImage = imagesByDay[currentDay];
        if (dayImage) {
          setImageUrl(dayImage);
        } else {
          throw new Error(`No image found for ${currentDay}`);
        }
      } catch (err) {
        console.error('Error fetching mic image:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load mic image';
        setError(errorMessage);
        console.error('Full error details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMicImage();

    // Re-fetch when authentication changes
    const handleAuthChange = () => {
      fetchMicImage();
    };
    
    window.addEventListener('googleAuthChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('googleAuthChange', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="black">Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text fontSize="0.9em" color="red.300">{error}</Text>
      </Box>
    );
  }

  if (!isAuthenticated()) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text fontSize="0.9em" color="gray.400">Please sign in to view mic image</Text>
      </Box>
    );
  }

  if (!imageUrl) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text fontSize="0.9em" color="gray.400">No image found for today</Text>
      </Box>
    );
  }

  return (
    <Center w="100%" h="100%" p={4}>
      <Image
        src={imageUrl}
        alt="Mic for today"
        maxW="100%"
        maxH="100%"
        objectFit="contain"
      />
    </Center>
  );
}

