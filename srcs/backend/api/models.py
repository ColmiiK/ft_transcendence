from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Models are classes that contain data


# Anonymize an user when they're deleted
def anonymize():
    return User.objects.get_or_create(name="anonymous")[0]


class User(models.Model):
    name = models.CharField(max_length=255)
    alias = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    # avatar = models.ImageField(upload_to="avatars/") # This needs "Pillow" to be installed
    friends = models.ManyToManyField("self", blank=True, symmetrical=True)
    created = models.DateField(auto_now=True)
    is_online = models.BooleanField(default=False)
    last_login = models.DateTimeField(auto_now=True)
    wins = models.IntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
        ],
    )
    losses = models.IntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
        ],
    )

    def __str__(self):
        return self.alias


class Tournament(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    players = models.ManyToManyField(User, related_name="tournaments")
    player_amount = models.IntegerField(
        validators=[MinValueValidator(4), MaxValueValidator(16)]
    )


class Match(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    left_player = models.ForeignKey(
        User, related_name="left_player_matches", on_delete=models.SET(anonymize)
    )
    right_player = models.ForeignKey(
        User, related_name="right_player_matches", on_delete=models.SET(anonymize)
    )
    result = models.CharField(max_length=255)
    winner = models.ForeignKey(
        User, related_name="won_matches", on_delete=models.SET(anonymize)
    )
    loser = models.ForeignKey(
        User, related_name="lost_matches", on_delete=models.SET(anonymize)
    )
    tournament = models.ForeignKey(
        Tournament,
        related_name="matches",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )


class Chat(models.Model):
    first_user = models.ForeignKey(
        User, related_name="chats_as_first_user", on_delete=models.SET(anonymize)
    )
    second_user = models.ForeignKey(
        User, related_name="chats_as_second_user", on_delete=models.SET(anonymize)
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["first_user", "second_user"], name="unique_chat"
            ),
            models.CheckConstraint(
                check=models.Q(first_user__lt=models.F("second_user")),
                name="first_user_lt_second_user",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.first_user.id > self.second_user.id:
            self.first_user, self.second_user = self.second_user, self.first_user
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Chat between {self.first_user} and {self.second_user}"


class Message(models.Model):
    chat = models.ForeignKey(Chat, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(
        User, related_name="messages_sent", on_delete=models.SET(anonymize)
    )
    body = models.CharField(max_length=4096)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.alias} at {self.date}"
