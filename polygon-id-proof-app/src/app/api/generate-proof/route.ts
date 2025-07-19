import { NextResponse } from 'next/server';
import { runSignatureProofWorkflow } from '@/lib/polygonIdService';

// Increase API route timeout to 10 minutes
export const maxDuration = 600;

export async function POST() {
  try {
    console.log('🚀 Starting signature-based proof generation...');
    console.log('⏰ This process may take 2-5 minutes...');
    
    // Add timeout monitoring
    const startTime = Date.now();
    const logProgress = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(`⏱️  API route still running... ${elapsed.toFixed(1)}s elapsed`);
    }, 10000); // Log every 10 seconds
    
    try {
      const result = await runSignatureProofWorkflow();
      clearInterval(logProgress);
      
      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ Proof generation completed successfully in ${totalTime.toFixed(1)}s`);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      clearInterval(logProgress);
      throw error;
    }
  } catch (error) {
    console.error('❌ Error generating proof:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}