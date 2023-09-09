export interface Content {
    id: string;
    uid: string;
    team: string[];
    accountID: string;
    title: string;
    description: string;
    position: number;
    url: string;
    parentID: string;
    type: number; // 0=file, 1=link, 2=folder, 3=product
    views: number;
    productID: string;
    imageURL: string;
    creationDate: any;
    lastUpdated: any;
    downloadLink: string;
    mimeType: string;
    suffix: string;
    token: string;
    public: boolean;
}

export interface ExternalContent {
    id: string;
    uid: string;
    contentID: string;
    imageURL: string;
    title: string;
}

export interface Zipline {
    id: string;
    uid: string;
    to: string;
    message: string;
    title: string;
    url: string;
    heroImageURL: string;
    content: [];
    creationDate: any;
    profile: Profile;
    lastAccessedDate: any;
    isPop: boolean;
    emailAddress: string;
    views: number;
    contentViews: number;
    team: string[];
}

export interface Account {
    id: string;
    emailAddress: string;
    logoURL: string;
    businessName: string;
    description: string;
    phoneNumber: string;

    emailDomain: string;
    slug: string;
    owners: string[];
    color: string;

    websiteURL: string;
    creationDate: any;
    configured: boolean;
}

export interface Company {
    logoURL: string;
    businessName: string;
    description: string;
    websiteURL: string;
    phoneNumber: string;
    color: string;
    slug: string;
}

export interface Profile {
    id: string;
    username: string;
    emailAddress: string;
    avatarURL: string;
    fullName: string;
    description: string;
    creationDate: any;
    configured: boolean;
    fcmToken: string;
    phoneNumber: string;
    receiveMarketingMaterial: boolean;
    living: GeoLocation;
    gender: string;
    datingType: string;
    height: number;
    ethnicity: string;
    children: string;
    hometown: InfoItem;
    work: InfoItem;
    jobTitle: InfoItem;
    school: InfoItem;
    education: InfoItem;
    religion: InfoItem;
    politics: InfoItem;
    drinks: InfoItem;
    smoke: InfoItem;
    weed: InfoItem;
    drugs: InfoItem;
    media: Media[];
    friends: Friend[];
    benchedFriends: Friend[];
    about: string;
    qualities: string;
    memorableMoments: string;
}


export interface Media {
    url: string;
    image: boolean;
}

export interface Friend {
    uid: string;
    businessName: string;
    email: string;
    contactName: string;
    phoneNumber: string;
    websiteURL: string;
    address: Address;
    avatarURL: string;
}


export interface Address {
    line1: string;
    line2: string;
    country: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface InfoItem {
    data: string;
    visible: boolean;
}

export interface GeoLocation {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
}

