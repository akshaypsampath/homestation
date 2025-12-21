import { Box, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { findDocumentByName, getDocumentContent, isAuthenticated } from "../services/google-auth-service";

export default function TodoList({ isPortrait }: { isPortrait: boolean }) {
  const [todoLines, setTodoLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodoList = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Find the document by name
        console.log('Searching for document: Full TODO List');
        const documentId = await findDocumentByName("Full TODO List");
        console.log('Found document ID:', documentId);
        
        if (!documentId) {
          throw new Error('Document ID not found');
        }
        
        // Get the first 10 lines
        console.log('Fetching document content for ID:', documentId);
        const lines = await getDocumentContent(documentId);
        console.log('Retrieved lines:', lines);
        setTodoLines(lines);
      } catch (err) {
        console.error('Error fetching TODO list:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load TODO list';
        setError(errorMessage);
        console.error('Full error details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodoList();

    // Re-fetch when authentication changes
    const handleAuthChange = () => {
      fetchTodoList();
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
        <Text fontSize="0.9em" color="gray.400">Please sign in to view TODO list</Text>
      </Box>
    );
  }

  if (todoLines.length === 0) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text fontSize="0.9em" color="gray.400">No items found</Text>
      </Box>
    );
  }

  return (
    <Box w="100%" h="100%" p={4} overflowY="auto">
      <VStack align="flex-start" spacing={1} h="100%">
        {todoLines.map((line, index) => {
          // Render empty lines as spacing - match line height of text (1.4em)
          if (!line.trim()) {
            return <Box key={index} h="1.4em" />
          }
          return (
            <Text
              key={index}
              fontSize={isPortrait ? "1.1em" : "1.1em"}
              fontWeight="600"
              color="black"
              lineHeight="1.4"
              textAlign="left"
            >
              {line}
            </Text>
          )
        })}
      </VStack>
    </Box>
  );
}

