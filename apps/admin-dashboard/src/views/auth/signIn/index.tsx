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
import { NavLink } from "react-router-dom";
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
  const handleClick = () => setShow(!show);
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
            Enter your email and password to sign in!
          </Text>
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
                Email<Text color={brandStars}>*</Text>
              </FormLabel>
              <Input
                isRequired={true}
                variant='auth'
                fontSize='sm'
                ms={{ base: "0px", md: "0px" }}
                type='email'
                placeholder='mail@simmmple.com'
                mb='24px'
                fontWeight='500'
                size='lg'
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
                  placeholder='Min. 8 characters'
                  mb='24px'
                  size='lg'
                  type={show ? "text" : "password"}
                  variant='auth'
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
                fontSize='sm'
                variant='brand'
                fontWeight='500'
                w='100%'
                h='50'
                mb='24px'>
                Sign In
              </Button>
            </FormControl>
          </Flex>
        </Box>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;
