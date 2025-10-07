import React from 'react';
import { Typography, Navbar } from "@material-tailwind/react";

function Header() {
  return (
    <Navbar className="p-4 shadow-md rounded-none">
      <Typography variant="h6" color="blue-gray">
        Welcome, Teacher!
      </Typography>
    </Navbar>
  );
}

export default Header;
