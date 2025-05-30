const MS_CLIENT_ID = process.env.MS_CLIENT_ID as string
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET as string
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string
const HOST = process.env.NEXT_PUBLIC_HOST as string

if (!MS_CLIENT_ID || !MS_CLIENT_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !HOST) {
  throw new Error('Missing required environment variables for OAuth configuration')
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export async function exchangeMicrosoftToken(code: string): Promise<TokenResponse> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      code,
      redirect_uri: `${HOST}/oauth/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange Microsoft token')
  }

  return response.json()
}

export async function exchangeGoogleToken(code: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${HOST}/oauth/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange Google token')
  }

  return response.json()
}

export async function revokeMicrosoftToken(accessToken: string, refreshToken?: string | null): Promise<void> {
  // Revoke access token
  const accessTokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      token: accessToken,
    }),
  })

  if (!accessTokenResponse.ok) {
    const errorText = await accessTokenResponse.text()
    console.error('Failed to revoke Microsoft access token:', errorText)
    throw new Error(`Failed to revoke Microsoft access token: ${errorText}`)
  }

  // If refresh token exists, revoke it as well
  if (refreshToken) {
    const refreshTokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        token: refreshToken,
      }),
    })

    if (!refreshTokenResponse.ok) {
      const errorText = await refreshTokenResponse.text()
      console.error('Failed to revoke Microsoft refresh token:', errorText)
      throw new Error(`Failed to revoke Microsoft refresh token: ${errorText}`)
    }
  }
}

export async function revokeGoogleToken(accessToken: string, refreshToken?: string | null): Promise<void> {
  // Revoke access token
  const accessTokenResponse = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`, {
    method: 'GET',
  })

  if (!accessTokenResponse.ok) {
    const errorText = await accessTokenResponse.text()
    console.error('Failed to revoke Google access token:', errorText)
    throw new Error(`Failed to revoke Google access token: ${errorText}`)
  }

  // If refresh token exists, revoke it as well
  if (refreshToken) {
    const refreshTokenResponse = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${refreshToken}`, {
      method: 'GET',
    })

    if (!refreshTokenResponse.ok) {
      const errorText = await refreshTokenResponse.text()
      console.error('Failed to revoke Google refresh token:', errorText)
      throw new Error(`Failed to revoke Google refresh token: ${errorText}`)
    }
  }
} 