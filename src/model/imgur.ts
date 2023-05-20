export const getDefaultImgurData = () => ({
    id: '',
    title: null,
    description: null,
    datetime: 1668271187,
    type: 'image/png' as string,
    animated: false,
    width: 0,
    height: 0,
    size: 0,
    views: 0,
    bandwidth: 0,
    vote: null as number | null,
    favorite: false,
    nsfw: null as boolean | null,
    section: null,
    account_url: null,
    account_id: 0,
    is_ad: false,
    in_most_viral: false,
    has_sound: false,
    tags: [],
    ad_type: 0,
    ad_url: '',
    edited: '',
    in_gallery: false,
    deletehash: '',
    name: '',
    link: '',
});
export type ImgurData = ReturnType<typeof getDefaultImgurData>;

export const getDefaultImgurResponse = () => ({
    data: getDefaultImgurData(),
    status: 0,
    success: false,
});
export type ImgurResponse = ReturnType<typeof getDefaultImgurResponse>;