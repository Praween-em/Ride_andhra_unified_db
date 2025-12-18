// src/utils/msg91.ts

interface VerifyAccessTokenResponse {
  type: string;
  message: string;
  mobile?: string;
  // Add other properties if available in MSG91's response
}

export const verifyMsg91AccessToken = async (accessToken: string): Promise<VerifyAccessTokenResponse> => {
  const url = new URL('https://control.msg91.com/api/v5/widget/verifyAccessToken');

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const body = {
    "authkey": "479641ACv4HX0B6926b235P1", // Hardcoded as per user's request
    "access-token": accessToken
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MSG91 API responded with status ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    console.log('MSG91 Direct Verify Access Token response:', json);
    return json;

  } catch (error) {
    console.error('Error verifying MSG91 Access Token:', error);
    throw error;
  }
};
