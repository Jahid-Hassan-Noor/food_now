// src/app/loading.js 
'use client';
import React from 'react';
import { HashLoader } from "react-spinners";

function Loading() {
  return (
        // <>
            <div className="flex items-center justify-center h-screen">
                <HashLoader 
                    size={70}
                    className= "justify-center align-center"
                    color="#38bdf8" 
                />
            </div>
        // </>
    );
}

export default Loading;