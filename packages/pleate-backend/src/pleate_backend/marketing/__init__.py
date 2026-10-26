"""
Marketing: newsletter (double opt in), contact form and waitlist with referrals.
Backs the pleate ``Newsletter``, ``ContactForm`` and waitlist components.
Mounted at ``/api/marketing/``.

Public endpoints (anonymous allowed, CSRF enforced, throttle scope ``contact``):

    POST newsletter/subscribe     {email, source?}             202 {confirmation_required}
        Same answer whatever the state of the email (no enumeration). With
        NEWSLETTER_DOUBLE_OPT_IN a confirmation email (template
        ``newsletter_confirm``) links to FRONTEND_PATHS["NEWSLETTER_CONFIRM"].
        A signed in user subscribing their own verified email skips it.
    POST newsletter/confirm       {token}                      {email, status}   (scope ``auth``)
    POST newsletter/unsubscribe   {token}                      {email, status}   (scope ``auth``)
    POST contact                  {name, email, subject?, message (10..5000), website?}
                                                               201 {received: true}
        ``website`` is a honeypot: when filled the message is stored as
        ``spam``, nothing is sent and the answer is the same. Otherwise
        CONTACT_RECIPIENTS (or every active staff user when empty) get the
        ``contact_message`` email with Reply-To set to the sender.
    POST waitlist                 {email, ref?}                {position, referral_code, referrals, invited}
        Idempotent: an email already on the list gets its current status.
    GET  waitlist/<referral_code>                              {position, referrals}

Staff endpoints (``is_staff``):

    GET   subscribers             paginated, ?search= (email), ?status=, ?source=, ?ordering=created_at,email
    GET   subscribers/export      text/csv of subscribed emails
    GET   contact-messages        paginated, ?search= (name, email, subject), ?status=
    PATCH contact-messages/<id>   {status: new|read|archived|spam}
    GET   waitlist                paginated, ?search= (email, referral_code),
                                  ?ordering=created_at,email,invited_at
    POST  waitlist/<id>/invite    sets invited_at, sends ``waitlist_invite``

Waitlist position: ``rank`` is 1 + the people still waiting who joined
earlier; each referral moves you up WAITLIST_REFERRAL_BONUS places:
``position = max(1, rank - bonus * referrals)``, 0 once invited.

Settings (``PLEATE["MARKETING"]``):

    CONTACT_RECIPIENTS        []      emails that receive contact messages
    NEWSLETTER_DOUBLE_OPT_IN  True
    WAITLIST_REFERRAL_BONUS   5       places gained per referral

Frontend paths: NEWSLETTER_CONFIRM, NEWSLETTER_UNSUBSCRIBE (``{token}``) and
the optional WAITLIST_INVITE (``{code}``, ``{email}``; the frontend root otherwise).

Helpers (``pleate_backend.marketing.services``):

    unsubscribe_url(subscriber)   link to put in every newsletter you send
    waitlist_status(entry)        {position, referral_code, referrals, invited}

Emails: ``newsletter_confirm``, ``contact_message``, ``waitlist_invite``.
The account export gets a ``marketing`` section (subscriptions, contact
messages and waitlist entries matching the user's email).
"""
