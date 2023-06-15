## Drag-n-Drop when scrolling is a mess, should be an edge case though
## Multiple deck modal
Vì sao làm multiple deck modal lại khó đến vậy :'(
* Việc stack modal đã (có vẻ) làm được
* Việc move card từ modal ra ngoài và ngược lại (có vẻ) đã làm được
* Việc move card từ modal này sang modal khác có nhiều vấn đề nghiêm trọng
    * Stack bằng z-index khiến việc move card qua lại giữa 2 modal có rất nhiều bug
    * Một behavior cần có là khi move từ modal A qua modal B mà có overlap, modal A không được phép nhảy cao hơn modal B (nói cách khác thứ tự z index của modal A và B không được thay đổi), tuy nhiên card trong modal A cũng vì vậy mà không bao giờ cao hơn modal B, và do đó sẽ bị modal B che đi, ta chỉ có thể chọn giữa behavior truyền thống và bỏ behavior này in favor of multiple modal

Entity queue

Board
DeckButton
    => Beacon
    : Move Card to Board
    : Move Card to DeckButton : Beacon
    : Move Card to DeckModal : Beacon
Card
    : Move Card around Board
    : Move Card to DeckButton : Beacon
    : Move Card to DeckModal : Beacon
DeckModal
    => Beacon
    : Drag Card to Board
    : Drag Card to DeckButton : Beacon
    : Drag Card to DeckModal

https://i.imgur.com/YgaX2lG.png
https://i.imgur.com/p9Ogumt.png
https://i.imgur.com/NM1vrsS.png
https://i.imgur.com/zYH5QtC.png
https://i.imgur.com/fM4cbNb.png
https://i.imgur.com/Y7rRxaV.png
https://i.imgur.com/q3PxbhU.png
https://i.imgur.com/4ADMrbA.jpg

https://images.ygoprodeck.com/images/cards/34541863.jpg
https://images.ygoprodeck.com/images/cards/64163367.jpg
https://images.ygoprodeck.com/images/cards/91231901.jpg
https://images.ygoprodeck.com/images/cards/73262676.jpg
https://images.ygoprodeck.com/images/cards/37478723.jpg
https://images.ygoprodeck.com/images/cards/64867422.jpg
https://images.ygoprodeck.com/images/cards/90861137.jpg
https://images.ygoprodeck.com/images/cards/44256816.jpg
https://images.ygoprodeck.com/images/cards/86988864.jpg
https://images.ygoprodeck.com/images/cards/11714098.jpg
https://images.ygoprodeck.com/images/cards/83994646.jpg
https://images.ygoprodeck.com/images/cards/67048711.jpg
https://images.ygoprodeck.com/images/cards/23771716.jpg
https://images.ygoprodeck.com/images/cards/86198326.jpg
https://images.ygoprodeck.com/images/cards/14261867.jpg
https://images.ygoprodeck.com/images/cards/24140059.jpg
https://images.ygoprodeck.com/images/cards/6850209.jpg
https://images.ygoprodeck.com/images/cards/49140998.jpg
https://images.ygoprodeck.com/images/cards/68170903.jpg
https://images.ygoprodeck.com/images/cards/21597117.jpg
https://images.ygoprodeck.com/images/cards/8949584.jpg
https://images.ygoprodeck.com/images/cards/295517.jpg
https://images.ygoprodeck.com/images/cards/32207100.jpg
https://images.ygoprodeck.com/images/cards/51351302.jpg
https://images.ygoprodeck.com/images/cards/27551.jpg

f9bbe0da263580e
3f45f6bb2ac38e4f9568dc8be1f32c5ee98bbce3