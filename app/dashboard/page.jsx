import { UserButton } from '@clerk/nextjs';
import React from 'react';
import AddNewInterview from './_components/AddNewInterview';
import InterviewList from './_components/InterviewList';

function Dashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-10">
      
      <h2 className="text-gray-700 dark:text-gray-300 text-2xl mb-6 text-center">
        Start your Interview journey by giving our mock interview
      </h2>

      <div className="w-full flex justify-center mb-8">
        <div className="w-full max-w-md">
          <AddNewInterview />
        </div>
      </div>


      <div className="w-full flex justify-center mb-8 items-center">
        <div className="w-full">
          <InterviewList />
        </div>
      </div>

      
    </div>
  );
}

export default Dashboard;
