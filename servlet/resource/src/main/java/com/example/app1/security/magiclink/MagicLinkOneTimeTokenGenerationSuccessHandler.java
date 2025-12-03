
package com.security.magiclink;

public class MagicLinkOneTimeTokenGenerationSuccessHandler {
    // implements OneTimeTokenGenerationSuccessHandler {

    // private final MailSender mailSender;

    // private final OneTimeTokenGenerationSuccessHandler redirectHandler =
    // new RedirectOneTimeTokenGenerationSuccessHandler("/ott/sent");

    // public MagicLinkOneTimeTokenGenerationSuccessHandler(MailSender mailSender) {
    // this.mailSender = mailSender;
    // }

    // @Override
    // public void handle(HttpServletRequest request, HttpServletResponse response,
    // OneTimeToken oneTimeToken)
    // throws IOException, ServletException {

    // UriComponentsBuilder builder = UriComponentsBuilder
    // .fromHttpUrl(UrlUtils.buildFullRequestUrl(request))
    // .replacePath(request.getContextPath())
    // .replaceQuery(null)
    // .fragment(null)
    // .path("/login/ott")
    // .queryParam("token", oneTimeToken.getTokenValue());

    // String magicLink = builder.toUriString();
    // String email = getUserEmail(oneTimeToken.getUsername());

    // this.mailSender.send(
    // email,
    // "Your Spring Security One Time Token",
    // "Use the following link to sign in into the application: " + magicLink
    // );

    // this.redirectHandler.handle(request, response, oneTimeToken);
    // }
}
