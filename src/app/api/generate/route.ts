// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  advancedQHCEncrypt,
  advancedQDSGenerateSignature,
} from "../../../../lib/cryptoUtils";
// Import blockchain utility functions including the new mineBlock
import { hashProductDetails, mineBlock } from "../../../../lib/blockchainUtils"; // Assuming path is correct
// Import the Prisma client instance
import prisma from "../../../../lib/db"; // Adjust path if needed

// --- Configuration ---
const BLOCKCHAIN_DIFFICULTY = 3; // Number of leading zeros required for the block hash (e.g., 3 means hash must start with "000")
// Adjust difficulty based on desired generation time vs. security simulation

// API Route Handler for POST requests
export async function POST(request: NextRequest) {
  console.log("Received request for /api/generate");
  try {
    // Parse request body
    const {
      productName,
      sku,
      batch,
      manufactureDate,
      quantity,
      destinationShop,
      secretKey,
    } = await request.json();

    // --- Step 1: Generate Crypto Data (Encryption and Signature) ---
    const productDetails = {
      productName,
      sku,
      batch,
      manufactureDate,
      quantity,
      destinationShop,
    };
    const productDataString = JSON.stringify(productDetails); // Stringify for encryption
    const encrypted = advancedQHCEncrypt(productDataString, secretKey);
    const signature = advancedQDSGenerateSignature(encrypted, secretKey);
    console.log("Crypto data generated.");

    // --- Step 2: Prepare Data for Blockchain Block Mining ---
    const timestamp = Date.now();
    const productDetailsHash = hashProductDetails(productDetails); // Hash original details
    const encryptedDataSalt = encrypted.split(".")[0]; // Use salt as a link to the specific encrypted data
    if (!encryptedDataSalt) {
      throw new Error("Failed to extract salt from encrypted data.");
    }

    // --- Get Previous Block Hash using Prisma ---
    let previousBlockHash: string;
    try {
      console.log("[API Generate] Fetching last block hash from DB...");
      const lastBlock = await prisma.blockchainLedger.findFirst({
        orderBy: { createdAt: "desc" }, // Order by creation time to get the latest
        select: { current_block_hash: true },
      });
      previousBlockHash = lastBlock
        ? lastBlock.current_block_hash
        : "0".repeat(64); // Genesis hash
      console.log(
        `[API Generate] Previous block hash fetched: ${previousBlockHash.substring(
          0,
          10
        )}...`
      );
    } catch (dbError) {
      console.error(
        "[API Generate] Database error fetching last block hash:",
        dbError
      );
      throw new Error("Could not retrieve previous block hash from database.");
    }

    const dataToMine = {
      timestamp,
      product_details_hash: productDetailsHash,
      encrypted_data_salt: encryptedDataSalt,
      signature,
      previous_block_hash: previousBlockHash,
    };

    // --- Step 3: Mine the Block (Find Nonce and Valid Hash) ---
    console.log("[API Generate] Starting block mining...");
    const { nonce, hash: currentBlockHash } = mineBlock(
      dataToMine,
      BLOCKCHAIN_DIFFICULTY
    );

    // --- Step 4: Assemble the Full Block Record and Add to Ledger using Prisma ---
    const newBlockData = {
      timestamp: BigInt(timestamp),
      product_details_hash: productDetailsHash,
      encrypted_data_salt: encryptedDataSalt,
      signature: signature,
      previous_block_hash: previousBlockHash,
      nonce: nonce,
      current_block_hash: currentBlockHash,
    };

    let addedBlockId: string | null = null; // Use string for MongoDB ID
    try {
      console.log(
        `[API Generate] Attempting to save block to DB with salt: ${encryptedDataSalt}`
      );
      const addedBlock = await prisma.blockchainLedger.create({
        data: newBlockData,
      });
      addedBlockId = addedBlock.id; // Store the ID returned by Prisma
      console.log(
        `[API Generate] Prisma create successful. Block ID: ${addedBlock.id}, Salt: ${addedBlock.encrypted_data_salt}`
      );

      // *** ADD CONFIRMATION QUERY ***
      // Immediately try to read the block back to confirm it was saved
      if (addedBlockId) {
        console.log(
          `[API Generate] Confirming block save by querying ID: ${addedBlockId}`
        );
        const confirmationBlock = await prisma.blockchainLedger.findUnique({
          where: { id: addedBlockId },
        });
        if (confirmationBlock) {
          console.log(
            `[API Generate] CONFIRMED block with ID ${addedBlockId} and salt ${confirmationBlock.encrypted_data_salt} exists in DB.`
          );
        } else {
          // If we can't find it immediately, something is wrong with the write or DB connection/consistency
          console.error(
            `[API Generate] CONFIRMATION FAILED! Block with ID ${addedBlockId} not found immediately after creation.`
          );
          throw new Error(
            "Database confirmation check failed after block creation. Block might not have been saved."
          );
        }
      } else {
        // This case shouldn't happen if create doesn't throw, but good failsafe
        throw new Error(
          "Block creation seemed successful but did not return an ID."
        );
      }
      // *****************************
    } catch (dbError: unknown) {
      console.error(
        "[API Generate] Database error during block creation or confirmation:",
        dbError
      );
      const errorObj = dbError as {
        code?: string;
        meta?: { target?: string[] };
        message?: string;
      };

      if (
        errorObj.code === "P2002" ||
        (errorObj.meta && errorObj.meta.target?.includes("encrypted_data_salt"))
      ) {
        throw new Error(
          `Failed to save block: An item with the same salt (${encryptedDataSalt}) already exists in the ledger.`
        );
      } else if (
        errorObj.code === "P2002" ||
        (errorObj.meta && errorObj.meta.target?.includes("current_block_hash"))
      ) {
        throw new Error(
          `Failed to save block: A block with the same hash already exists (hash collision?).`
        );
      }
      // Rethrow other DB errors
      throw new Error(
        `Failed to save the new block to the database: ${
          errorObj.message || dbError
        }`
      );
    }

    // --- Step 5: Return Crypto Data to Frontend ---
    console.log("[API Generate] Sending crypto data back to frontend.");
    return NextResponse.json({ encrypted, signature, secretKey });
  } catch (error: unknown) {
    // Log the detailed error on the server
    console.error("Error in /api/generate route:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during generation.";
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}
