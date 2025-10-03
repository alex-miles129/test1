const { create } = require("@web3-storage/w3up-client");
const { filesFromPaths } = require("files-from-path");
const fs = require("fs");
const path = require("path");

/**
 * Upload property metadata and documents to IPFS using web3.storage
 * This script demonstrates how to upload property images and metadata
 */

async function uploadToIPFS() {
  console.log("🌐 Starting IPFS upload process...\n");

  try {
    // Create web3.storage client
    const client = await create();

    // Check if client has accounts configured
    if (!Object.keys(client.accounts()).length) {
      console.log("❌ No web3.storage accounts found!");
      console.log("Please run the following steps:");
      console.log("1. Sign up at https://web3.storage");
      console.log("2. Run this script with your email to login");
      console.log("3. Check your email and click the verification link");
      console.log("4. Re-run this script");
      
      if (process.env.WEB3_STORAGE_EMAIL) {
        console.log(`\n⏳ Attempting login with ${process.env.WEB3_STORAGE_EMAIL}...`);
        const account = await client.login(process.env.WEB3_STORAGE_EMAIL);
        console.log("✅ Login successful! Check your email for verification.");
        return;
      }
      
      return;
    }

    // Create a space for uploads if doesn't exist
    let space;
    const spaces = client.spaces();
    if (spaces.length === 0) {
      console.log("📁 Creating new space...");
      space = await client.createSpace("realtoken-property-data");
      await space.save();
      
      // Associate with account
      const account = Object.values(client.accounts())[0];
      await account.provision(space.did());
      console.log(`✅ Space created: ${space.did()}\n`);
    } else {
      space = spaces[0];
      console.log(`📁 Using existing space: ${space.did()}\n`);
    }

    // Create sample property data
    const propertyData = createSamplePropertyData();
    
    // Create temporary files for upload
    const tempDir = path.join(__dirname, '../temp-ipfs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Write metadata JSON
    const metadataPath = path.join(tempDir, 'property-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(propertyData.metadata, null, 2));

    // Write sample property documents
    const docsPath = path.join(tempDir, 'property-documents.txt');
    fs.writeFileSync(docsPath, propertyData.documents);

    // Create a simple property image (placeholder)
    const imagePath = path.join(tempDir, 'property-image.txt');
    fs.writeFileSync(imagePath, "PROPERTY_IMAGE_PLACEHOLDER - In production, this would be an actual image file");

    console.log("📄 Sample files created:");
    console.log(`  - Metadata: ${metadataPath}`);
    console.log(`  - Documents: ${docsPath}`);
    console.log(`  - Image: ${imagePath}\n`);

    // Upload files to IPFS
    console.log("⬆️  Uploading to IPFS via web3.storage...");
    
    const files = await filesFromPaths([tempDir]);
    const root = await client.uploadDirectory(files);
    
    console.log(`✅ Upload successful!`);
    console.log(`📍 IPFS CID: ${root.toString()}`);
    console.log(`🔗 Gateway URL: https://${root}.ipfs.w3s.link/`);
    console.log(`📱 View files at: https://w3s.link/ipfs/${root}/\n`);

    // Clean up temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("🧹 Temporary files cleaned up");

    // Return the CID for use in contracts
    const result = {
      ipfsHash: root.toString(),
      gatewayUrl: `https://${root}.ipfs.w3s.link/`,
      metadata: propertyData.metadata,
      uploadedAt: new Date().toISOString()
    };

    console.log("\n📋 IPFS Upload Result:");
    console.log(JSON.stringify(result, null, 2));

    // Save result to file for reference
    const resultPath = path.join(__dirname, '../ipfs-upload-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Result saved to: ${resultPath}`);

    return result;

  } catch (error) {
    console.error("❌ IPFS upload failed:");
    console.error(error);
    
    if (error.message.includes('login')) {
      console.log("\n💡 Tip: Make sure you have a web3.storage account and are logged in.");
      console.log("Set WEB3_STORAGE_EMAIL environment variable with your email.");
    }
    
    throw error;
  }
}

function createSamplePropertyData() {
  return {
    metadata: {
      name: "Sunset Villa - Premium Real Estate Investment",
      description: "Luxury 4-bedroom villa located in the prestigious Sunset Boulevard area of Los Angeles. This prime investment property features ocean views, modern amenities, swimming pool, and is situated in one of the most desirable neighborhoods in the city.",
      image: "property-image.jpg", // Reference to uploaded image
      external_url: "https://realtoken-demo.com/property/sunset-villa",
      attributes: [
        {
          trait_type: "Property Type",
          value: "Residential Villa"
        },
        {
          trait_type: "Bedrooms",
          value: 4
        },
        {
          trait_type: "Bathrooms",
          value: 3
        },
        {
          trait_type: "Square Feet",
          value: 3500
        },
        {
          trait_type: "Year Built",
          value: 2018
        },
        {
          trait_type: "Location",
          value: "Los Angeles, CA"
        },
        {
          trait_type: "Neighborhood",
          value: "Sunset Boulevard"
        },
        {
          trait_type: "Property Value",
          value: "$500,000 USD"
        },
        {
          trait_type: "Expected Annual ROI",
          value: "8-12%"
        },
        {
          trait_type: "Token Supply",
          value: "500,000 SVT"
        }
      ],
      properties: {
        address: "123 Sunset Boulevard, Los Angeles, CA 90210",
        zipCode: "90210",
        coordinates: {
          lat: 34.0901,
          lng: -118.4065
        },
        propertyType: "Single Family Home",
        totalValue: 500000,
        tokenSupply: 500000,
        pricePerToken: 1,
        currency: "USD",
        investmentType: "Rental Income + Appreciation",
        managementCompany: "RealToken Property Management LLC",
        insurance: "Fully Insured",
        maintenance: "Professional Property Management",
        tenant: {
          status: "Occupied",
          leaseEnd: "2024-12-31",
          monthlyRent: 3500
        }
      },
      legal: {
        propertyId: "LA-SUNSET-001",
        deedReference: "SAMPLE-DEED-REF-12345",
        title: "Clear Title",
        zoning: "Residential R1",
        taxAssessment: 485000,
        propertyTaxAnnual: 6037.50
      }
    },
    documents: `PROPERTY DOCUMENTATION
====================================

SUNSET VILLA - INVESTMENT PROPERTY DOCUMENTATION
Property ID: LA-SUNSET-001
Date: ${new Date().toLocaleDateString()}

1. PROPERTY OVERVIEW
   - Address: 123 Sunset Boulevard, Los Angeles, CA 90210
   - Property Type: Single Family Residential Villa  
   - Built: 2018
   - Total Square Feet: 3,500
   - Bedrooms: 4
   - Bathrooms: 3
   - Lot Size: 0.25 acres

2. FINANCIAL DETAILS
   - Purchase Price: $500,000 USD
   - Property Tax (Annual): $6,037.50
   - Insurance (Annual): $2,400
   - Management Fee: 8% of rental income
   - Current Monthly Rent: $3,500
   - Annual Rental Income: $42,000
   - Net Operating Income: $33,162.50

3. TOKENIZATION DETAILS  
   - Total Token Supply: 500,000 SVT tokens
   - Price per Token: $1.00 USD (1 mUSDC)
   - Minimum Investment: 10 tokens ($10)
   - Maximum Investment: 10,000 tokens ($10,000)

4. INVESTMENT TERMS
   - Investment Type: Fractional Real Estate Ownership
   - Token Standard: ERC-20
   - Blockchain: Polygon (Mumbai Testnet)
   - Rental Income Distribution: Quarterly
   - Management: Professional property management included
   - Liquidity: Tokens can be traded on secondary markets

5. LEGAL STRUCTURE
   - Property held in SPV (Special Purpose Vehicle)
   - Token holders have proportional ownership rights
   - All necessary permits and licenses obtained
   - Property title is clear and unencumbered
   - Full legal compliance with local regulations

6. RISK FACTORS
   - Real estate market volatility
   - Tenant vacancy risk
   - Property damage or maintenance costs
   - Regulatory changes affecting tokenized assets
   - Liquidity risk for token trading

7. ADDITIONAL AMENITIES
   - Swimming pool with spa
   - 2-car garage
   - Modern kitchen with premium appliances
   - Hardwood flooring throughout
   - Smart home automation system
   - Landscaped garden with ocean views
   - Close to schools, shopping, and entertainment

NOTE: This is a demonstration document for hackathon purposes only.
Real property investments require proper due diligence and legal documentation.`
  };
}

// Execute if run directly
if (require.main === module) {
  uploadToIPFS()
    .then((result) => {
      console.log("\n🎉 IPFS upload completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 IPFS upload failed:", error);
      process.exit(1);
    });
}

module.exports = { uploadToIPFS, createSamplePropertyData };