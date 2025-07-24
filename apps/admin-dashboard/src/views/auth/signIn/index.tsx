/* eslint-disable */
/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2022 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import React from "react";
import { NavLink, Navigate, useNavigate } from "react-router-dom";
// Chakra imports
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  Image,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
// Custom components
import { HSeparator } from "components/separator/Separator";
import DefaultAuth from "layouts/auth/Default";
// Assets
import illustration from "assets/img/auth/auth.png";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import iacsLogo from "assets/img/iacs.png";
// Auth context
import { useAuth } from "contexts/AuthContext";

function SignIn() {
  // Chakra color mode
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorDetails = useColorModeValue("navy.700", "secondaryGray.600");
  const textColorBrand = useColorModeValue("brand.500", "white");
  const brandStars = useColorModeValue("brand.500", "brand.400");
  const googleBg = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const googleText = useColorModeValue("navy.700", "white");
  const googleHover = useColorModeValue(
    { bg: "gray.200" },
    { bg: "whiteAlpha.300" }
  );
  const googleActive = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.200" }
  );
  const [show, setShow] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const handleClick = () => setShow(!show);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/admin/default');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      // Handle any unexpected errors during login
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      {/* IACS Logo at the top-right */}
      <Box position="absolute" top="32px" right="32px" zIndex={10}>
        <Image src={iacsLogo} alt='IACS Logo' h='80px' />
      </Box>
      <Flex
        w='100%'
        h='100%'
        alignItems='center'
        justifyContent='center'
        flexDirection='column'
        px={{ base: "25px", md: "0px" }}>
        <Box w='100%' maxW='420px'>
          <Heading color={textColor} fontSize='36px' mb='10px' textAlign='center'>
            Sign In
          </Heading>
          <Text
            mb='36px'
            ms='4px'
            color={textColorSecondary}
            fontWeight='400'
            fontSize='md'
            textAlign='center'>
            Enter your username and password to sign in!
          </Text>
          
          {error && (
            <Alert status="error" borderRadius="lg" mb="24px">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Flex
              zIndex='2'
              direction='column'
              w='100%'
              background='transparent'
              borderRadius='15px'
              mb={{ base: "20px", md: "auto" }}>
              <FormControl>
                <FormLabel
                  display='flex'
                  ms='4px'
                  fontSize='sm'
                  fontWeight='500'
                  color={textColor}
                  mb='8px'>
                  Username<Text color={brandStars}>*</Text>
                </FormLabel>
                <Input
                  isRequired={true}
                  variant='auth'
                  fontSize='sm'
                  ms={{ base: "0px", md: "0px" }}
                  type='text'
                  placeholder='Enter your username'
                  mb='24px'
                  fontWeight='500'
                  size='lg'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <FormLabel
                  ms='4px'
                  fontSize='sm'
                  fontWeight='500'
                  color={textColor}
                  display='flex'>
                  Password<Text color={brandStars}>*</Text>
                </FormLabel>
                <InputGroup size='md'>
                  <Input
                    isRequired={true}
                    fontSize='sm'
                    placeholder='Enter your password'
                    mb='24px'
                    size='lg'
                    type={show ? "text" : "password"}
                    variant='auth'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement display='flex' alignItems='center' mt='4px'>
                    <Icon
                      color={textColorSecondary}
                      _hover={{ cursor: "pointer" }}
                      as={(show ? RiEyeCloseLine : MdOutlineRemoveRedEye) as any}
                      onClick={handleClick}
                    />
                  </InputRightElement>
                </InputGroup>
                <Flex justifyContent='space-between' align='center' mb='24px'>
                  <FormControl display='flex' alignItems='center'>
                    <Checkbox
                      id='remember-login'
                      colorScheme='brandScheme'
                      me='10px'
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <FormLabel
                      htmlFor='remember-login'
                      mb='0'
                      fontWeight='normal'
                      color={textColor}
                      fontSize='sm'>
                      Keep me logged in
                    </FormLabel>
                  </FormControl>
                  <NavLink to='/auth/forgot-password'>
                    <Text
                      color={textColorBrand}
                      fontSize='sm'
                      w='124px'
                      fontWeight='500'>
                      Forgot password?
                    </Text>
                  </NavLink>
                </Flex>
                <Button
                  type="submit"
                  fontSize='sm'
                  variant='brand'
                  fontWeight='500'
                  w='100%'
                  h='50'
                  mb='24px'
                  isLoading={isLoading}
                  loadingText="Signing in...">
                  Sign In
                </Button>
              </FormControl>
            </Flex>
          </form>
        </Box>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;
